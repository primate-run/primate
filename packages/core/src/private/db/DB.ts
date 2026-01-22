import type As from "#db/As";
import type DataDict from "#db/DataDict";
import type DataKey from "#db/DataKey";
import type Sort from "#db/Sort";
import type TypeMap from "#db/TypeMap";
import type Types from "#db/Types";
import fail from "#fail";
import assert from "@rcompat/assert";
import entries from "@rcompat/dict/entries";
import is from "@rcompat/is";
import type { Dict, MaybePromise } from "@rcompat/type";
import type { DataType, StoreSchema } from "pema";

type BindPrefix = "$" | ":" | "";

export type With = Dict<{
  as: As;
  kind: "one" | "many";
  fk: string;
  reverse?: boolean;
  // subquery options (normalized by Store)
  criteria: DataDict;
  fields?: string[];
  sort?: Sort;
  limit?: number;
}>;

function required(operation: string) {
  return fail("{0}: at least one column required", operation);
}

function normalize_sort(direction: "asc" | "desc") {
  if (typeof direction !== "string")
    throw fail("invalid sort direction {0}", direction);

  const lowered = direction.toLowerCase();
  if (lowered !== "asc" && lowered !== "desc")
    throw fail("invalid sort direction {0}", direction);
  return lowered.toUpperCase();
}

export default abstract class DB {
  #bind_prefix: BindPrefix;
  abstract close(): MaybePromise<void>;

  constructor(bind_prefix?: "$" | ":") {
    this.#bind_prefix = bind_prefix ?? "";
  }

  #assert(types: Types, columns: string[]) {
    const known = new Set(Object.keys(types));
    const unknown = columns.filter(c => !known.has(c));
    if (unknown.length > 0) {
      throw fail("unknown column(s) {0}", unknown.join(", "));
    }
  }

  #quote(name: string) {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
      throw fail("invalid identifier {0}", name);
    }
    return `\`${name}\``;
  }

  ident(name: string) {
    return this.#quote(name);
  }

  table(as: As) {
    return this.#quote(as.name);
  }

  toSelect(types: Types, columns?: string[]) {
    assert.maybe.array(columns);

    if (!columns) return "*";
    if (columns.length === 0) throw required("select");

    this.#assert(types, columns);

    return columns.map(this.#quote).join(", ");
  }

  toSort(types: Types, sort?: Sort) {
    assert.maybe.dict(sort);

    if (!sort) return "";

    const columns = Object.entries(sort);
    if (columns.length === 0) throw required("sort");

    this.#assert(types, columns.map(([k]) => k));

    const order = columns
      .map(([k, direction]) => `${this.#quote(k)} ${normalize_sort(direction)}`)
      .join(", ");

    return ` ORDER BY ${order}`;
  }

  toLimit(limit?: number) {
    assert.maybe.uint(limit);

    return limit !== undefined ? ` LIMIT ${limit}` : "";
  }

  like(prefix: BindPrefix, column: string, bind_key: string, icase: boolean) {
    // default: ANSI-ish fallback (works most places, not always indexed)
    const quoted = this.#quote(column);
    const rhs = `${prefix}${bind_key}`;
    return icase
      ? `LOWER(${quoted}) LIKE LOWER(${rhs})`
      : `${quoted} LIKE ${rhs}`;
  }

  toWhere(types: Types, criteria: DataDict) {
    const columns = Object.keys(criteria);
    this.#assert(types, columns);

    if (columns.length === 0) return "";

    const prefix = this.#bind_prefix;
    const parts: string[] = [];

    for (const column of columns) {
      const v = criteria[column];

      // null criteria
      if (v === null) {
        parts.push(`${this.#quote(column)} IS NULL`);
        continue;
      }

      // operator objects: only plain dicts
      if (is.dict(v)) {
        const ops = Object.entries(v);
        if (ops.length === 0) throw fail("empty operator object");

        for (const [op] of ops) {
          const suffix = op.startsWith("$") ? op.slice(1) : op;
          const bind_key = `${column}__${suffix}`;

          switch (op) {
            case "$like":
              parts.push(this.like(prefix, column, bind_key, false));
              break;

            case "$ilike":
              parts.push(this.like(prefix, column, bind_key, true));
              break;

            case "$gte":
              parts.push(`${this.#quote(column)} >= ${prefix}${bind_key}`);
              break;

            case "$gt":
            case "$after":
              parts.push(`${this.#quote(column)} > ${prefix}${bind_key}`);
              break;

            case "$lte":
              parts.push(`${this.#quote(column)} <= ${prefix}${bind_key}`);
              break;

            case "$lt":
            case "$before":
              parts.push(`${this.#quote(column)} < ${prefix}${bind_key}`);
              break;

            case "$ne":
              parts.push(`${this.#quote(column)} != ${prefix}${bind_key}`);
              break;

            default:
              throw fail("unsupported operator in field {0}", column);
          }
        }

        continue;
      }

      parts.push(`${this.#quote(column)}=${prefix}${column}`);
    }

    return `WHERE ${parts.join(" AND ")}`;
  }

  async toSet(types: Types, changeset: DataDict) {
    const columns = Object.keys(changeset);

    this.#assert(types, columns);

    if (columns.length === 0) throw required("set");

    const p = this.#bind_prefix; // "$" or ":"

    const set = `SET ${columns.map(c =>
      `${this.#quote(c)}=${p}s_${c}`).join(", ")}`;

    const raw = Object.fromEntries(columns.map(c => [`s_${c}`, changeset[c]]));
    // bind original keys (e.g. { age: 35 } -> { $age: 35 })
    const binds = await this.bind(types, raw);

    return { set, binds };
  }

  #bind<K extends DataKey>(key: K, value: DataType[K] | null) {
    return value === null
      ? null
      : this.typemap[key].bind(value);
  }

  #unbind(key: DataKey, value: unknown) {
    return this.typemap[key].unbind(value);
  }

  column(key: DataKey) {
    return this.typemap[key].column;
  };

  abstract get typemap(): TypeMap;

  abstract schema: {
    create(name: string, description: StoreSchema): MaybePromise<void>;
    delete(name: string): MaybePromise<void>;
  };

  // identity
  formatBinds(binds: Dict): Dict {
    return binds;
  }

  async bind<In extends DataDict>(types: Types, object: In): Promise<Dict> {
    const out = Object.fromEntries(
      await Promise.all(
        Object.entries(object).map(async ([key, value]) => {
          // `bind()` is for scalar values only
          if (is.dict(value)) {
            throw fail("operator object cannot be bound directly for {0}", key);
          }

          const raw = key.startsWith("s_") ? key.slice(2) : key;
          const base = raw.split("__")[0];

          const bound = await this.#bind(types[base], value);
          return [`${this.#bind_prefix}${key}`, bound];
        }),
      ),
    );

    return this.formatBinds(out);
  }

  async bindCriteria(types: Types, criteria: DataDict): Promise<Dict> {
    const filtered: DataDict = {};
    this.#assert(types, Object.keys(criteria));

    for (const [key, value] of Object.entries(criteria)) {
      // null isn't bound
      if (value === null) continue;

      // only treat *plain dicts* as operator objects
      if (is.dict(value)) {
        const ops = Object.entries(value);
        if (ops.length === 0) throw fail("empty operator object");

        for (const [op, op_value] of ops) {
          const suffix = op.startsWith("$") ? op.slice(1) : op;
          const bind_key = `${key}__${suffix}`;

          switch (op) {
            case "$like":
            case "$ilike":
            case "$gte":
            case "$gt":
            case "$after":
            case "$lte":
            case "$lt":
            case "$before":
            case "$ne":
              filtered[bind_key] = op_value as any;
              break;
            default:
              throw fail("unsupported operator in field {0}", key);
          }
        }

        continue;
      }

      filtered[key] = value;
    }

    return this.bind(types, filtered);
  }

  unbind(types: Types, object: Dict): Dict {
    return entries(object)
      .filter(([, value]) => value !== null)
      .map(([key, value]) => [key, this.#unbind(types[key], value)])
      .get();
  }

  abstract create<O extends Dict>(as: As, args: {
    record: Dict;
  }): MaybePromise<O>;

  abstract read(as: As, args: {
    count: true;
    criteria: Dict;
    with?: never; // disallow relations for count reads
  }): MaybePromise<number>;

  abstract read(as: As, args: {
    criteria: Dict;
    fields?: string[];
    limit?: number;
    sort?: Sort;
    with?: With;
  }): MaybePromise<Dict[]>;

  abstract update(as: As, args: {
    changeset: Dict;
    criteria: Dict;
  }): MaybePromise<number>;

  abstract delete(as: As, args: { criteria: Dict }): MaybePromise<number>;

  abstract lastId(name: string, pk: string): MaybePromise<number | bigint>;
};
