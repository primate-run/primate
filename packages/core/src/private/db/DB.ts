import type As from "#db/As";
import type AsPK from "#db/AsPK";
import type DataDict from "#db/DataDict";
import type DataKey from "#db/DataKey";
import E from "#db/error";
import type PK from "#db/PK";
import type Sort from "#db/Sort";
import type TypeMap from "#db/TypeMap";
import type Types from "#db/Types";
import type With from "#db/With";
import assert from "@rcompat/assert";
import entries from "@rcompat/dict/entries";
import is from "@rcompat/is";
import type { Dict, MaybePromise } from "@rcompat/type";
import type { DataType, StoreSchema } from "pema";

type BindPrefix = "$" | ":" | "";

function normalize_sort(key: string, direction: "asc" | "desc") {
  if (!is.string(direction)) throw E.sort_invalid();

  const l = direction.toLowerCase();
  if (l !== "asc" && l !== "desc") throw E.sort_invalid_value(key, direction);

  return l.toUpperCase();
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
    if (unknown.length > 0) throw E.fields_unknown(unknown);
  }

  #quote(name: string) {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) E.identifier_invalid(name);
    return `\`${name}\``;
  }

  quote(name: string) {
    return this.#quote(name);
  }

  table(as: As) {
    return this.#quote(as.name);
  }

  toSelect(types: Types, columns?: string[]) {
    assert.maybe.array(columns);

    if (columns === undefined) return "*";
    if (columns.length === 0) throw E.field_required("select");

    this.#assert(types, columns);

    return columns.map(this.#quote).join(", ");
  }

  toSort(types: Types, sort?: Sort, alias?: string) {
    assert.maybe.dict(sort);
    if (sort === undefined) return "";
    const columns = Object.entries(sort);
    if (columns.length === 0) throw E.field_required("sort");
    this.#assert(types, columns.map(([k]) => k));

    const order = columns
      .map(([k, direction]) => {
        const quoted = this.#quote(k);
        const col = alias ? `${alias}.${quoted}` : quoted;
        return `${col} ${normalize_sort(k, direction)}`;
      })
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

  toWhere(types: Types, where: DataDict) {
    const columns = Object.keys(where);
    this.#assert(types, columns);

    if (columns.length === 0) return "";

    const prefix = this.#bind_prefix;
    const parts: string[] = [];

    for (const column of columns) {
      const v = where[column];

      // null where
      if (v === null) {
        parts.push(`${this.#quote(column)} IS NULL`);
        continue;
      }

      // operator objects: only plain dicts
      if (is.dict(v)) {
        const ops = Object.entries(v);
        if (ops.length === 0) throw E.operator_empty(column);

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
              throw E.operator_unknown(column, op);
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

    if (columns.length === 0) throw E.field_required("set");

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
    create(name: string, description: StoreSchema, pk: PK): MaybePromise<void>;
    delete(name: string): MaybePromise<void>;
  };

  aliases(tables: string[]) {
    const counts: Dict<number> = {};
    const result: Dict<string> = {};

    for (const table of tables) {
      const prefix = table[0].toLowerCase();
      counts[prefix] ??= 0;
      result[table] = `${prefix}${counts[prefix]++}`;
    }

    return result;
  }

  select(aliases: Dict, as: As, fields?: string[]) {
    const alias = aliases[as.name];
    return (fields ?? Object.keys(as.types))
      .map(f => `${alias}.${this.quote(f)} AS ${alias}_${f}`)
      .join(", ");
  }

  // identity
  formatBinds(binds: Dict): Dict {
    return binds;
  }

  async bind<In extends DataDict>(types: Types, object: In): Promise<Dict> {
    const out = Object.fromEntries(
      await Promise.all(
        Object.entries(object).map(async ([key, value]) => {
          // `bind()` is for scalar values only
          if (is.dict(value)) throw E.operator_scalar(key);

          const raw = key.startsWith("s_") ? key.slice(2) : key;
          const base = raw.split("__")[0];

          const bound = await this.#bind(types[base], value);
          return [`${this.#bind_prefix}${key}`, bound];
        }),
      ),
    );

    return this.formatBinds(out);
  }

  async bindWhere(types: Types, where: DataDict): Promise<Dict> {
    const filtered: DataDict = {};
    this.#assert(types, Object.keys(where));

    for (const [key, value] of Object.entries(where)) {
      // null isn't bound
      if (value === null) continue;

      // only treat *plain dicts* as operator objects
      if (is.dict(value)) {
        const ops = Object.entries(value);
        if (ops.length === 0) throw E.operator_empty(key);

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
              throw E.operator_unknown(key, op);
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
    where: Dict;
    with?: never; // disallow relations for count reads
  }): MaybePromise<number>;

  abstract read(as: As, args: {
    where: Dict;
    fields?: string[];
    limit?: number;
    sort?: Sort;
    with?: With;
  }): MaybePromise<Dict[]>;

  abstract update(as: As, args: {
    set: Dict;
    where: Dict;
  }): MaybePromise<number>;

  abstract delete(as: As, args: { where: Dict }): MaybePromise<number>;

  abstract lastId(as: AsPK): MaybePromise<number | bigint>;
};
