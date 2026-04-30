import type DataDict from "#db/DataDict";
import type DB from "#db/DB";
import E from "#db/errors";
import type PK from "#db/PK";
import type Types from "#db/Types";
import type With from "#db/With";
import type ExtractRelations from "#store/ExtractRelation";
import type ExtractSchema from "#store/ExtractSchema";
import type ForeignKey from "#store/ForeignKey";
import type { AllowedFKType } from "#store/ForeignKey";
import type Init from "#store/Init";
import parse from "#store/parse";
import type PrimaryKey from "#store/PrimaryKey";
import type { ManyRelation, OneRelation, Relation } from "#store/relation";
import relation from "#store/relation";
import type StoreInput from "#store/StoreInput";
import assert from "@rcompat/assert";
import dict from "@rcompat/dict";
import is from "@rcompat/is";
import type { Dict, Serializable } from "@rcompat/type";
import type { DefaultType, InferStore, Storable } from "pema";
import StoreType from "pema/StoreType";

const brand = Symbol.for("@primate/core/Store/v0");

type X<T> = { [K in keyof T]: T[K] } & {};

type OrNull<T> = {
  [P in keyof T]?: null | T[P];
};

type Query = {
  where?: unknown;
  select?: unknown;
  sort?: unknown;
  limit?: unknown;
  offset?: unknown;
};

type StringOperators = {
  $like?: string;
  $ilike?: string;
  $in?: string[];
};

type NumberOperators = {
  $gt?: number;
  $gte?: number;
  $lt?: number;
  $lte?: number;
  $ne?: number;
  $in?: number[];
};

type BigIntOperators = {
  $gt?: bigint;
  $gte?: bigint;
  $lt?: bigint;
  $lte?: bigint;
  $ne?: bigint;
  $in?: bigint[];
};

type DateOperators = {
  $before?: Date;
  $after?: Date;
  $ne?: Date;
  $in?: Date[];
};

type QueryOperators<T> =
  T extends string ? (T | StringOperators | null) :
  T extends number ? (T | NumberOperators | null) :
  T extends bigint ? (T | BigIntOperators | null) :
  T extends Date ? (T | DateOperators | null) :
  (T | null);

type InferRecord<T extends StoreInput> = InferStore<ExtractSchema<T>>;

type Schema<T extends StoreInput> = X<InferRecord<T>>;

type Where<T extends StoreInput> = X<{
  [K in keyof Schema<T>]?: QueryOperators<Schema<T>[K]>;
}>;

type $Set<T extends StoreInput> = X<OrNull<InferStore<ExtractSchema<T>>>>;

type SelectKey<T> = Extract<keyof T, string>;
type Select<T> = readonly SelectKey<T>[];

type Sort<T> = Partial<Record<SelectKey<T>, "asc" | "desc">>;

type Projected<T, S extends Select<T> | undefined> =
  S extends readonly (keyof T)[]
  ? X<Pick<T, S[number]>>
  : T;

type DefaultFields<T extends StoreInput> = {
  [K in keyof InferRecord<T>]: T[K] extends DefaultType<any, any> ? K : never
}[keyof InferRecord<T>];

type Insertable<T extends StoreInput> =
  Omit<InferRecord<T>, PrimaryKeyField<T> | DefaultFields<T>> &
  Partial<Pick<InferRecord<T>, PrimaryKeyField<T> | DefaultFields<T>>>;

type PrimaryKeyField<T extends StoreInput> = {
  [K in keyof T]: T[K] extends PrimaryKey<any> ? K : never
}[keyof T] & keyof InferRecord<T>;

type SchemaOf<S> = S extends Store<infer T, any> ? Schema<T> : never;

type StoreT<S> = S extends Store<infer T, any> ? T : never;

type RelationTable<R> =
  R extends OneRelation<infer N, string> ? N :
  R extends ManyRelation<infer N, string> ? N :
  never;

type RelationStore<N extends string> = Store<any, N>;

type WithQuery<
  N extends string,
  S extends RelationStore<N> = RelationStore<N>,
> = {
  store: S;
  where?: Where<StoreT<S>> & DataDict;
  select?: readonly (keyof Schema<StoreT<S>> & string)[];
  sort?: Sort<Schema<StoreT<S>>> & ReadSort;
  limit?: number;
};

type WithInput<R extends Dict<Relation>> = {
  [K in keyof R]?: RelationStore<RelationTable<R[K]>>
  | WithQuery<RelationTable<R[K]>, RelationStore<RelationTable<R[K]>>>;
};

type RelationResult<Rel, W> =
  Rel extends OneRelation<string, string>
  ? W extends WithQuery<string, infer S>
  ? W["select"] extends readonly (keyof SchemaOf<S> & string)[]
  ? Pick<SchemaOf<S>, W["select"][number]> | null
  : SchemaOf<S> | null
  : SchemaOf<W> | null  // bare store
  : Rel extends ManyRelation<string, string>
  ? W extends WithQuery<string, infer S>
  ? W["select"] extends readonly (keyof SchemaOf<S> & string)[]
  ? Pick<SchemaOf<S>, W["select"][number]>[]
  : SchemaOf<S>[]
  : SchemaOf<W>[]  // bare store
  : never;

type WithRelations<
  Base,
  R extends Dict<Relation>,
  W extends WithInput<R> | undefined,
> = W extends object
  ? X<Base & {
    [K in keyof W & keyof R]: RelationResult<R[K], W[K]>;
  }>
  : Base;

const NUMBER_KEYS = [
  "u8", "u16", "u32",
  "i8", "i16", "i32",
  "f32", "f64"] as const;
const BIGINT_KEYS = ["u64", "u128", "i64", "i128"] as const;

type NumberKey = typeof NUMBER_KEYS[number];
type BigIntKey = typeof BIGINT_KEYS[number];

const is_number_key = (d: string): d is NumberKey =>
  (NUMBER_KEYS as readonly string[]).includes(d);

const is_bigint_key = (d: string): d is BigIntKey =>
  (BIGINT_KEYS as readonly string[]).includes(d);

type PKV<T extends StoreInput> =
  T[PrimaryKeyField<T>] extends PrimaryKey<infer P>
  ? P extends Storable<infer D>
  ? D extends "uuid" | "uuid_v4" | "uuid_v7" ? string
  : D extends NumberKey ? number
  : D extends BigIntKey ? bigint
  : string | number | bigint
  : string | number | bigint
  : string | number | bigint;

type ReadSort = Dict<"asc" | "desc">;

const VALID_IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

function guard_options<
  T extends object,
  const K extends readonly (keyof T & string)[],
>(options: T | undefined, allowed: K) {
  if (is.undefined(options)) return;

  const allowed_set = new Set<string>(allowed as readonly string[]);

  for (const k of Object.keys(options)) {
    if (!allowed_set.has(k)) throw E.option_unknown(k);
  }
}

const INT_LIMITS = {
  u8: [0, 255],
  u16: [0, 65535],
  u32: [0, 4294967295],

  i8: [-128, 127],
  i16: [-32768, 32767],
  i32: [-2147483648, 2147483647],
} as const;

const BIGINT_LIMITS = {
  u64: [0n, (1n << 64n) - 1n],
  i64: [-(1n << 63n), (1n << 63n) - 1n],

  u128: [0n, (1n << 128n) - 1n],
  i128: [-(1n << 127n), (1n << 127n) - 1n],
} as const;

function assert_number_value(key: string, datatype: NumberKey, value: number) {
  if (!is.finite(value)) throw E.where_invalid_value(key, value);

  if (dict.has(INT_LIMITS, datatype)) {
    if (!is.safeint(value)) throw E.where_invalid_value(key, value);
    const [min, max] = INT_LIMITS[datatype as keyof typeof INT_LIMITS];
    if (value < min || value > max) throw E.where_invalid_value(key, value);
  }
}

function assert_bigint_value(key: string, datatype: BigIntKey, value: bigint) {
  const [min, max] = BIGINT_LIMITS[datatype];
  if (value < min || value > max) throw E.where_invalid_value(key, value);
}

const STRING_OPS = ["$like", "$ilike", "$in"];
const NUMBER_OPS = ["$gt", "$gte", "$lt", "$lte", "$ne", "$in"];
const BIGINT_OPS = ["$gt", "$gte", "$lt", "$lte", "$ne", "$in"];
const DATE_OPS = ["$before", "$after", "$ne", "$in"];

/**
 * Database-backed store.
 *
 * A `Store` exposes a typed, validated interface over a relational or
 * document database table/collection. It pairs a Pema schema with a uniform
 * CRUD/query API.
 */
export default class Store<
  T extends StoreInput,
  N extends string = string,
> implements Serializable {
  [brand] = true;
  #input: StoreInput;
  #schema: StoreType<ExtractSchema<T>>;
  #types: Types;
  #nullables: Set<string>;
  #table: N;
  #db: DB;
  #pk: PK;
  #generate_pk: boolean;
  #fks: Map<string, ForeignKey<AllowedFKType>>;
  #relations: ExtractRelations<T>;
  #migrate: boolean;
  #id: symbol;

  declare readonly Schema: Schema<T>;

  static is(x: unknown): x is Store<any, any> {
    return is.branded(x, brand);
  }

  constructor(init: Init<T, N>) {
    const { table, db, migrate, id } = init;
    const { pk, generate_pk, fks, schema } = parse(init.schema);

    if (is.undefined(table)) throw E.store_table_required();
    assert.string(table);
    if (!VALID_IDENTIFIER.test(table)) throw E.identifier_invalid(table);
    assert.defined(db, E.db_missing as any);
    assert.dict(schema);
    assert.maybe.boolean(migrate);
    assert.maybe.dict(init.extend);
    assert.maybe.symbol(id);

    this.#id = id ?? Symbol();
    this.#schema = new StoreType(schema as ExtractSchema<T>, pk);
    this.#types = Object.fromEntries(
      Object.entries(schema).map(([key, value]) => [key, value.datatype]),
    );
    this.#table = table;
    this.#db = db;
    this.#pk = pk;
    this.#generate_pk = generate_pk;
    this.#fks = fks;
    this.#input = init.schema as StoreInput;
    this.#relations = Object.fromEntries(
      Object.entries(init.schema).filter(([, v]) => relation.is(v)),
    ) as ExtractRelations<T>;
    this.#migrate = migrate ?? true;
    this.#nullables = new Set(
      Object.entries(this.#schema.properties as Dict<{ nullable: boolean }>)
        .filter(([, v]) => v.nullable)
        .map(([k]) => k),
    );

    if (is.defined(init.extend)) {
      for (const [k, v] of Object.entries(init.extend)) {
        if (k in this) throw E.key_duplicate(k);
        (this as any)[k] = v;
      }
    }
  }

  get #as() {
    return {
      table: this.#table,
      pk: this.#pk,
      generate_pk: this.#generate_pk,
      types: this.#types,
    };
  }

  async create() {
    return this.db.schema.create(this.#table, {
      name: this.#pk,
      generate: this.#generate_pk,
    }, this.#types);
  }

  async drop() {
    return this.db.schema.delete(this.#table);
  }

  get infer() {
    return undefined as unknown as InferRecord<T>;
  }

  get schema() {
    return this.#schema;
  }

  get migrate() {
    return this.#migrate;
  }

  get id() {
    return this.#id;
  }

  get table() {
    return this.#table;
  }

  get pk() {
    return this.#pk;
  }

  get db() {
    return this.#db;
  }

  get types() {
    return this.#types;
  }

  #parse_pk(pkv: unknown): string {
    const pk = this.#pk;
    if (is.null(pk)) throw E.pk_undefined(this.#table);
    try {
      (this.#schema.properties as Dict<Storable>)[pk].parse(pkv);
    } catch {
      throw E.pk_invalid(pkv);
    }
    return pk;
  }

  #parse_query(query: Query, types: Types) {
    const { where, select, sort, limit, offset } = query;

    if (is.defined(where)) this.#parse_where(where, types);
    if (is.defined(select)) this.#parse_select(select, types);
    if (is.defined(sort)) this.#parse_sort(sort, types);
    if (is.defined(limit) && !is.uint(limit)) throw E.limit_invalid();
    if (is.defined(offset)) {
      if (!is.uint(offset)) throw E.offset_invalid();
      if (is.undefined(limit)) throw E.offset_requires_limit();
    }
  }

  #with(options?: WithInput<ExtractRelations<T>>) {
    if (is.undefined(options)) return undefined;

    const plan: With = {};

    for (const [name, input] of dict.entries(options)) {
      if (is.undefined(input)) continue;

      const relation = this.#relations[name] as Relation | undefined;
      if (is.undefined(relation)) throw E.relation_unknown(name);

      const is_query = is.dict(input) && "store" in input;
      const passed_store = is_query
        ? (input as WithQuery<string>).store
        : Store.is(input) ? input : undefined;
      if (is.undefined(passed_store)) throw E.relation_store_required(name);
      const query = is_query
        ? input as WithQuery<string>
        : undefined;

      if (passed_store.table !== relation.table) {
        throw E.relation_table_mismatch(relation.table, passed_store.table);
      }

      this.#parse_query(query ?? {}, passed_store.types);

      plan[name] = {
        as: {
          table: passed_store.table,
          pk: passed_store.pk,
          types: passed_store.types,
        },
        kind: relation.type,
        fk: relation.fk,
        reverse: "reverse" in relation && relation.reverse === true,
        where: query?.where ?? {},
        fields: query?.select ? [...query.select] : undefined,
        sort: query?.sort,
        limit: query?.limit,
      };
    }

    return plan;
  }

  #parse_where(where: unknown, types: Types) {
    if (!is.dict(where)) throw E.where_invalid();

    for (const [k, value] of Object.entries(where)) {
      if (!VALID_IDENTIFIER.test(k)) throw E.identifier_invalid(k);
      if (!dict.has(types, k)) throw E.field_unknown(k, "where");
      if (is.undefined(value)) throw E.field_undefined(k, "where");

      const datatype = types[k];

      // null criteria (IS NULL semantics)
      if (is.null(value)) continue;

      // arrays are always invalid
      if (is.array(value)) throw E.where_invalid_value(k, value);

      if (is.dict(value)) {
        const ops = Object.entries(value);
        if (ops.length === 0) throw E.operator_empty(k);

        for (const [op, op_val] of ops) {
          if (op_val === undefined) throw E.field_undefined(k, "where");

          if (datatype === "string" || datatype === "time") {
            if (!STRING_OPS.includes(op)) throw E.operator_unknown(k, op);
            if (op === "$in") {
              if (!is.array(op_val)) throw E.wrong_type("array", k, op_val, op);
              if (op_val.length === 0) throw E.operator_empty_in(k);
              for (const v of op_val) {
                if (!is.string(v)) throw E.wrong_type("string", k, v, op);
              }
              continue;
            }
            if (!is.string(op_val)) throw E.wrong_type("string", k, op_val, op);
            continue;
          }

          if (is_number_key(datatype)) {
            if (!NUMBER_OPS.includes(op)) throw E.operator_unknown(k, op);
            if (op === "$in") {
              if (!is.array(op_val)) throw E.wrong_type("array", k, op_val, op);
              if (op_val.length === 0) throw E.operator_empty_in(k);
              for (const v of op_val) {
                if (!is.number(v)) throw E.wrong_type("number", k, v, op);
                assert_number_value(k, datatype, v);
              }
              continue;
            }
            if (!is.number(op_val)) throw E.wrong_type("number", k, op_val, op);
            assert_number_value(k, datatype, op_val);
            continue;
          }

          if (is_bigint_key(datatype)) {
            if (!BIGINT_OPS.includes(op)) throw E.operator_unknown(k, op);
            if (op === "$in") {
              if (!is.array(op_val)) throw E.wrong_type("array", k, op_val, op);
              if (op_val.length === 0) throw E.operator_empty_in(k);
              for (const v of op_val) {
                if (!is.bigint(v)) throw E.wrong_type("bigint", k, v, op);
                assert_bigint_value(k, datatype, v);
              }
              continue;
            }
            if (!is.bigint(op_val)) throw E.wrong_type("bigint", k, op_val, op);
            assert_bigint_value(k, datatype, op_val);
            continue;
          }

          if (datatype === "datetime") {
            if (!DATE_OPS.includes(op)) throw E.operator_unknown(k, op);
            if (op === "$in") {
              if (!is.array(op_val)) throw E.wrong_type("array", k, op_val, op);
              if (op_val.length === 0) throw E.operator_empty_in(k);
              for (const v of op_val) {
                if (!is.date(v)) throw E.wrong_type("date", k, v, op);
              }
              continue;
            }
            if (!is.date(op_val)) throw E.wrong_type("date", k, op_val, op);
            continue;
          }

          if (datatype === "uuid" || datatype === "uuid_v4" || datatype === "uuid_v7") {
            if (op !== "$in") throw E.operator_unknown(k, op);
            if (!is.array(op_val)) throw E.wrong_type("array", k, op_val, op);
            if (op_val.length === 0) throw E.operator_empty_in(k);
            for (const v of op_val) {
              if (!is.string(v)) throw E.wrong_type("string", k, v, op);
            }
            continue;
          }

          // url/boolean/blob: no operator objects
          throw E.operator_unknown(k, op);
        }

        continue;
      }

      switch (datatype) {
        case "string":
        case "time":
          if (!is.string(value)) throw E.wrong_type("string", k, value);
          continue;
        case "u8": case "u16": case "u32":
        case "i8": case "i16": case "i32":
        case "f32": case "f64":
          if (!is.number(value)) throw E.wrong_type("number", k, value);
          assert_number_value(k, datatype, value);
          continue;
        case "u64": case "u128": case "i64": case "i128":
          if (!is.bigint(value)) throw E.wrong_type("bigint", k, value);
          assert_bigint_value(k, datatype, value);
          continue;
        case "datetime":
          if (!is.date(value)) throw E.wrong_type("date", k, value);
          continue;
        case "boolean":
          if (!is.boolean(value)) throw E.wrong_type("boolean", k, value);
          continue;
        case "url":
          if (!is.url(value)) throw E.wrong_type("url", k, value);
          continue;
        case "blob":
          if (!is.blob(value)) throw E.wrong_type("blob", k, value);
          continue;
        case "uuid":
        case "uuid_v4":
        case "uuid_v7":
          if (!is.string(value)) throw E.wrong_type("string", k, value);
          continue;
        default:
          throw E.where_invalid_value(k, value);
      }
    }
  }

  #parse_select(select: unknown, types: Types) {
    if (!is.array(select)) throw E.select_invalid();
    if (select.length === 0) throw E.select_empty();
    const seen = new Set<string>();
    for (const [i, v] of select.entries()) {
      if (!is.string(v)) throw E.select_invalid_value(i, v);
      if (!VALID_IDENTIFIER.test(v)) throw E.identifier_invalid(v);
      if (!dict.has(types, v)) throw E.field_unknown(v, "select");
      // duplicate isn't harmful, but usually a thought error
      if (seen.has(v)) throw E.field_duplicate(v, "select");
      seen.add(v);
    }
  }

  #parse_sort(sort: unknown, types: Types) {
    if (!is.dict(sort)) throw E.sort_invalid();
    const keys = Object.keys(sort);
    if (keys.length === 0) throw E.sort_empty();

    for (const [k, direction] of Object.entries(sort)) {
      if (!is.string(direction)) throw E.sort_invalid_value(k, direction);
      if (!dict.has(types, k)) throw E.field_unknown(k, "sort");
      const l = direction.toLowerCase();
      if (l !== "asc" && l !== "desc") throw E.sort_invalid_value(k, direction);
    }
  }

  #prepare_insert(record: Dict): Dict {
    const out: Dict = {};
    for (const [k, v] of Object.entries(record)) {
      if (!dict.has(this.#types, k)) throw E.field_unknown(k, "insert");
      if (is.undefined(v)) continue; // treat as omission
      if (is.null(v)) throw E.null_not_allowed(k);
      out[k] = v;
    }
    return out;
  }

  /**
   * Count records
   */
  async count(options?: { where?: Where<T> }) {
    this.#parse_query(options ?? {}, this.#types);

    if (is.defined(options) && "with" in options) throw E.count_with_invalid();

    return await this.db.read(this.#as, {
      count: true,
      where: (options?.where ?? {}),
    });
  }

  /**
   * Check whether a record with the given primary key exists.
   */
  async has(pkv: PKV<T>) {
    const pk = this.#parse_pk(pkv);
    return (await this.count({ where: { [pk]: pkv } as Where<T> })) === 1;
  }

  /**
   * Get a record by primary key.
   *
   * - Without options: returns the full base record.
   * - With `select`: returns a projected record.
   * - With `with`: augments the record with relations.
   */
  get(pkv: PKV<T>): Promise<Schema<T>>;
  get<
    const S extends Select<Schema<T>> | undefined = undefined,
    const W extends WithInput<ExtractRelations<T>> | undefined = undefined,
  >(
    pkv: PKV<T>,
    options: {
      select?: S;
      with?: W;
    },
  ): Promise<WithRelations<Projected<Schema<T>, S>, ExtractRelations<T>, W>>;
  async get(
    pkv: PKV<T>,
    options?: { select?: readonly string[]; with?: WithInput<ExtractRelations<T>> },
  ) {
    const pk = this.#parse_pk(pkv);

    guard_options(options, ["select", "with"]);
    this.#parse_query(options ?? {}, this.#types);

    const $with = this.#with(options?.with);
    const records = await this.db.read(this.#as, {
      where: { [pk]: pkv },
      fields: options?.select ? [...options.select] : undefined,
      with: $with,
    });

    const n = records.length;
    assert.true(n <= 1, E.record_number_invalid(n, "get"));

    if (n === 0) {
      const err = E.record_not_found(pk, pkv);
      (err as any).not_found = true;
      throw err;
    }

    const raw = records[0] as Dict;

    // if projected, keep it as-is (no parse)
    if (is.defined(options?.select)) return raw;

    // parse *only* base fields (exclude relation keys)
    const base_only = Object.fromEntries(Object.entries(raw)
      .filter(([k]) => dict.has(this.#types, k)));
    const parsed = this.#schema.parse(base_only) as Dict;

    if (is.undefined($with)) return parsed;

    return {
      ...parsed,
      ...Object.fromEntries(Object.keys($with).map(k => [k, raw[k]])),
    };
  }

  /**
   * Try to get a record by primary key.
   */
  try(pkv: PKV<T>): Promise<Schema<T> | undefined>;
  try<
    const S extends Select<Schema<T>> | undefined = undefined,
    const W extends WithInput<ExtractRelations<T>> | undefined = undefined,
  >(
    pkv: PKV<T>,
    options: {
      select?: S;
      with?: W;
    },
  ): Promise<WithRelations<Projected<Schema<T>, S>, ExtractRelations<T>, W> | undefined>;
  async try(
    pkv: PKV<T>,
    options?: { select?: readonly string[]; with?: WithInput<ExtractRelations<T>> },
  ) {
    try {
      return await this.get(pkv, options as any);
    } catch (error) {
      if ((error as any)?.not_found === true) return undefined;
      throw error;
    }
  }

  /**
   * Insert a single record.
   */
  async insert(record: Insertable<T>): Promise<Schema<T>> {
    assert.dict(record);

    const prepared = this.#prepare_insert(record);

    return this.db.create(this.#as, this.#schema.parse(prepared));
  }

  /**
   * Update a single record by primary key.
   */
  update(pkv: PKV<T>, options: { set: $Set<T> }): Promise<void>;

  /**
   * Update multiple records (requires non-empty where).
   */
  update(options: { where?: Where<T>; set: $Set<T> }): Promise<number>;

  async update(
    arg0: PKV<T> | { where?: Where<T>; set: $Set<T> },
    options?: { set: $Set<T> },
  ) {
    const by_pk = options !== undefined;
    const set: $Set<T> = by_pk
      ? options.set
      : (arg0 as { where?: Where<T>; set: $Set<T> }).set;

    if (!is.dict(set) || is.empty(set)) throw E.set_empty();

    const pk = this.#pk;
    if (pk !== null && pk in set) throw E.pk_immutable(pk);

    for (const [k, v] of Object.entries(set)) {
      if (!dict.has(this.#types, k)) throw E.field_unknown(k, "set");
      if (is.null(v) && !this.#nullables.has(k)) throw E.null_not_allowed(k);
    }

    const entries = Object.entries(set);
    const to_parse = Object.fromEntries(entries
      .filter(([key, value]) => value !== null || !this.#nullables.has(key)));
    const nulls = Object.fromEntries(entries
      .filter(([key, value]) => value === null && this.#nullables.has(key)));

    const parsed = {
      ...this.#schema.partial().parse(to_parse),
      ...nulls,
    } as $Set<T>;

    if (by_pk) return this.#update_1(arg0 as PKV<T>, parsed);

    const where = (arg0 as { where?: Where<T>; set: $Set<T> }).where;
    if (is.defined(where)) this.#parse_where(where, this.#types);

    return this.#update_n((where ?? {}) as Where<T>, parsed);
  }

  async #update_1(pkv: PKV<T>, set: $Set<T>) {
    const pk = this.#parse_pk(pkv);
    const n = await this.db.update(this.#as, { set, where: { [pk]: pkv } });

    assert.true(n === 1, E.record_number_invalid(n, "update"));
  }

  async #update_n(where: Where<T>, set: $Set<T>) {
    return await this.db.update(this.#as, { set, where });
  }

  /**
   * Delete a single record by primary key.
   */
  delete(pkv: PKV<T>): Promise<void>;

  /**
   * Delete multiple records (requires non-empty where).
   */
  delete(options: { where: Where<T> }): Promise<number>;

  async delete(pkv_or_options: PKV<T> | { where: Where<T> }) {
    if (is.dict(pkv_or_options)) {
      const where = pkv_or_options.where as Where<T>;
      if (!is.dict(where) || is.empty(where)) throw E.where_required();
      this.#parse_where(where, this.#types);
      return this.#delete_n(where);
    }

    return this.#delete_1(pkv_or_options as PKV<T>);
  }

  async #delete_1(pkv: PKV<T>) {
    const pk = this.#parse_pk(pkv);
    const n = await this.db.delete(this.#as, { where: { [pk]: pkv } });
    assert.true(n === 1, E.record_number_invalid(n, "delete"));
  }

  async #delete_n(where: Where<T>) {
    return await this.db.delete(this.#as, { where: where });
  }

  /**
   * Find matching records
   *
   */
  async find<
    const S extends Select<Schema<T>> | undefined = undefined,
    const W extends WithInput<ExtractRelations<T>> | undefined = undefined,
  >(
    options?: {
      where?: Where<T>;
      select?: S;
      sort?: Sort<Schema<T>>;
      limit?: number;
      offset?: number;
      with?: W;
    },
  ): Promise<WithRelations<Projected<Schema<T>, S>, ExtractRelations<T>, W>[]> {
    guard_options(options, ["where", "select", "sort", "limit", "offset", "with"]);

    this.#parse_query(options ?? {}, this.#types);

    const result = await this.db.read(this.#as, {
      where: options?.where ?? {},
      fields: options?.select !== undefined ? [...options.select] : undefined,
      limit: options?.limit,
      offset: options?.offset,
      sort: options?.sort as ReadSort | undefined,
      with: this.#with(options?.with),
    });

    return result as never;
  }

  toJSON() {
    return this.#schema.toJSON();
  }

  extend<A extends Dict>(extensor: (This: this) => A): this & A {
    return new Store({
      table: this.#table,
      db: this.#db,
      schema: this.#input,
      migrate: this.#migrate,
      id: this.#id,
      extend: extensor(this),
    }) as unknown as this & A;
  }
}
