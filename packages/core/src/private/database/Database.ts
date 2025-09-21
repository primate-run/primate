import type As from "#database/As";
import type Binds from "#database/Binds";
import type DataDict from "#database/DataDict";
import type DataKey from "#database/DataKey";
import type Sort from "#database/Sort";
import type TypeMap from "#database/TypeMap";
import type Types from "#database/Types";
import fail from "#fail";
import maybe from "@rcompat/assert/maybe";
import entries from "@rcompat/record/entries";
import type Dict from "@rcompat/type/Dict";
import type MaybePromise from "@rcompat/type/MaybePromise";
import type DataType from "pema/DataType";
import type StoreSchema from "pema/StoreSchema";

function required(operation: string) {
  fail("{0}: at least one column required", operation);
}

function normalizeSort(direction: "asc" | "desc") {
  if (typeof direction !== "string")
    throw fail("invalid sort direction {0}", direction);

  const lowered = direction.toLowerCase();
  if (lowered !== "asc" && lowered !== "desc")
    throw fail("invalid sort direction {0}", direction);
  return lowered.toUpperCase();
}

export default abstract class Database {
  #bindPrefix: string;
  abstract close(): MaybePromise<void>;

  constructor(bindPrefix?: string) {
    this.#bindPrefix = bindPrefix ?? "";
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
    maybe(columns).array();

    if (!columns) return "*";
    if (columns.length === 0) throw required("select");

    this.#assert(types, columns);

    return columns.map(this.#quote).join(", ");
  }

  toSort(types: Types, sort?: Sort) {
    maybe(sort).record();

    if (!sort) return "";

    const columns = Object.entries(sort);
    if (columns.length === 0) throw required("sort");

    this.#assert(types, columns.map(([k]) => k));

    const order = columns
      .map(([k, direction]) => `${this.#quote(k)} ${normalizeSort(direction)}`)
      .join(", ");

    return ` ORDER BY ${order}`;
  }

  toLimit(limit?: number) {
    maybe(limit).usize();

    return limit !== undefined ? ` LIMIT ${limit}` : "";
  }

  toWhere(types: Types, criteria: Dict) {
    const columns = Object.keys(criteria);
    this.#assert(types, columns);

    if (columns.length === 0) return "";

    const p = this.#bindPrefix; // "$" or ":"

    const parts = columns.map(column => {
      const value = criteria[column];
      // emit IS NULL for null criteria (no bind)
      return value === null
        ? `${this.#quote(column)} IS NULL`
        : `${this.#quote(column)}=${p}${column}`;
    });

    return `WHERE ${parts.join(" AND ")}`;
  }

  async toSet(types: Types, changes: DataDict) {
    const columns = Object.keys(changes);

    this.#assert(types, columns);

    if (columns.length === 0) throw required("set");

    const p = this.#bindPrefix; // "$" or ":"

    const set = `SET ${columns.map(c =>
      `${this.#quote(c)}=${p}s_${c}`).join(", ")}`;

    const raw = Object.fromEntries(columns.map(c => [`s_${c}`, changes[c]]));
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
  formatBinds(binds: Binds): Binds {
    return binds;
  }

  async bind<In extends DataDict>(types: Types, object: In): Promise<Binds> {
    const out = Object.fromEntries(
      await Promise.all(
        Object.entries(object).map(async ([key, value]) => {
          // support "s_" pseudo-namespace for SET params
          const base = key.startsWith("s_") ? key.slice(2) : key;
          const bound = await this.#bind(types[base], value);
          return [`${this.#bindPrefix}${key}`, bound];
        }),
      ),
    );
    return this.formatBinds(out); // <-- hook applied once, everywhere
  }

  async bindCriteria(types: Types, criteria: Dict): Promise<Binds> {
    // only bind keys that are not null
    const filtered = Object.fromEntries(
      Object.entries(criteria).filter(([, v]) => v !== null),
    ) as DataDict;

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
  }): MaybePromise<number>;
  abstract read(as: As, args: {
    criteria: Dict;
    fields?: string[];
    limit?: number;
    sort?: Sort;
  }): MaybePromise<Dict[]>;

  abstract update(as: As, args: {
    changes: Dict;
    criteria: Dict;
  }): MaybePromise<number>;

  abstract delete(as: As, args: { criteria: Dict }): MaybePromise<number>;
};
