import type DB from "#db/DB";
import E from "#db/error";
import type PK from "#db/PK";
import wrap from "#db/symbol/wrap";
import type Types from "#db/Types";
import type DBWith from "#db/With";
import type ForeignKey from "#orm/ForeignKey";
import parse from "#orm/parse";
import type PrimaryKey from "#orm/PrimaryKey";
import type { ManyRelation, OneRelation, Relation } from "#orm/relation";
import type $Set from "#orm/Set";
import type {
  ExtractSchema,
  InferRecord,
  Insertable,
  PrimaryKeyField,
  StoreInput,
} from "#orm/types";
import assert from "@rcompat/assert";
import is from "@rcompat/is";
import type { Dict, EmptyObject, Serializable } from "@rcompat/type";
import type { DataKey, Storable } from "pema";
import StoreType from "pema/StoreType";

type X<T> = { [K in keyof T]: T[K] } & {};

type Query = {
  where?: unknown;
  select?: unknown;
  sort?: unknown;
  limit?: unknown;
};

type StringOperators = {
  $like?: string;
  $ilike?: string;
};

type NumberOperators = {
  $gt?: number;
  $gte?: number;
  $lt?: number;
  $lte?: number;
  $ne?: number;
};

type BigIntOperators = {
  $gt?: bigint;
  $gte?: bigint;
  $lt?: bigint;
  $lte?: bigint;
  $ne?: bigint;
};

type DateOperators = {
  $before?: Date;
  $after?: Date;
  $ne?: Date;
};

type QueryOperators<T> =
  T extends string ? (T | StringOperators | null) :
  T extends number ? (T | NumberOperators | null) :
  T extends bigint ? (T | BigIntOperators | null) :
  T extends Date ? (T | DateOperators | null) :
  (T | null);

type Schema<T extends StoreInput> = X<InferRecord<T>>;

type Where<T extends StoreInput> = X<{
  [K in keyof Schema<T>]?: QueryOperators<Schema<T>[K]>;
}>;

type SelectKey<T> = Extract<keyof T, string>;
type Select<T> = readonly SelectKey<T>[];

type Sort<T> = Partial<Record<SelectKey<T>, "asc" | "desc">>;

type Projected<T, S extends Select<T> | undefined> =
  S extends readonly (keyof T)[]
  ? X<Pick<T, S[number]>>
  : T;

type PrimaryKeyValue<T extends StoreInput> =
  T[PrimaryKeyField<T>] extends PrimaryKey<infer P>
  ? P extends Storable<infer D>
  ? D extends "string" ? string
  : D extends "u16" | "u32" ? number
  : D extends "u64" | "u128" ? bigint
  : string | number | bigint
  : string | number | bigint
  : string | number | bigint;

// `true` means: include relation with all fields
// Object means: include relation with specified where/select/sort/limit
type WithQuery<T extends StoreInput> = true | {
  where?: Where<T>;
  select?: Select<Schema<T>>;
  sort?: Sort<Schema<T>>;
  limit?: number;
};

type With<R extends Dict<Relation>> = {
  [K in keyof R]?: R[K] extends OneRelation<infer S, string>
  ? WithQuery<S>
  : R[K] extends ManyRelation<infer S, string>
  ? WithQuery<S>
  : never;
};

// given relation + query, compute the resulting field type
type RelationResult<Rel, Q> =
  Rel extends OneRelation<infer S, string>
  ? Q extends { select: infer Sel }
  ? Sel extends Select<Schema<S>>
  ? Projected<Schema<S>, Sel> | null
  : Schema<S> | null
  : Schema<S> | null
  : Rel extends ManyRelation<infer S, string>
  ? Q extends { select: infer Sel }
  ? Sel extends Select<Schema<S>>
  ? Projected<Schema<S>, Sel>[]
  : Schema<S>[]
  : Schema<S>[]
  : never;

// attach relations based on `with` input
type WithRelations<
  Base,
  Relations extends Dict<Relation>,
  W extends With<Relations> | undefined,
> = W extends object
  ? X<Base & {
    [K in keyof W & keyof Relations]: RelationResult<Relations[K], W[K]>;
  }>
  : Base;

type Config<R extends Dict<Relation>> = {
  db?: DB;
  name?: string;
  relations?: R;
};

type ReadSort = Dict<"asc" | "desc">;

const VALID_IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

function guard_options<
  T extends object,
  const K extends readonly (keyof T & string)[],
>(options: T | undefined, allowed: K) {
  if (options === undefined) return;

  const allowed_set = new Set<string>(allowed as readonly string[]);

  for (const k of Object.keys(options)) {
    if (!allowed_set.has(k)) throw E.option_unknown(k);
  }
}

function is_number_key(k: string) {
  return k === "u8"
    || k === "u16" || k === "u32"
    || k === "i8" || k === "i16" || k === "i32"
    || k === "f32" || k === "f64";
}

function is_bigint_key(k: string) {
  return k === "u64" || k === "u128"
    || k === "i64" || k === "i128";
}

const registry = new Map<Dict, Store<any>>();

const STRING_OPS = ["$like", "$ilike"];
const NUMBER_OPS = ["$gt", "$gte", "$lt", "$lte", "$ne"];
const BIGINT_OPS = ["$gt", "$gte", "$lt", "$lte", "$ne"];
const DATE_OPS = ["$before", "$after", "$ne"];

/**
 * Database-backed store.
 *
 * A `Store` exposes a typed, validated interface over a relational or
 * document database table/collection. It pairs a Pema schema with a uniform
 * CRUD/query API.
 */
export default class Store<
  T extends StoreInput,
  R extends Dict<Relation> = EmptyObject,
> implements Serializable {
  #schema: Dict<Storable<DataKey>>;
  #type: StoreType<ExtractSchema<T>>;
  #types: Types;
  #nullables: Set<string>;
  #db?: DB;
  #name?: string;
  #pk: PK;
  #fks: Map<string, ForeignKey<Storable<DataKey>>>;
  #relations: R;

  declare readonly Schema: Schema<T>;

  constructor(input: T, config: Config<R> = {}) {
    const { pk, fks, schema } = parse(input);

    this.#schema = schema;
    this.#type = new StoreType(schema as ExtractSchema<T>);
    this.#types = Object.fromEntries(
      Object.entries(schema).map(([key, value]) => [key, value.datatype]),
    );
    this.#name = config.name;
    this.#db = config.db;
    this.#pk = pk;
    this.#fks = fks;
    this.#relations = (config.relations ?? {}) as R;
    this.#nullables = new Set(
      Object.entries(this.#type.properties as Dict<{ nullable: boolean }>)
        .filter(([, v]) => v.nullable)
        .map(([k]) => k),
    );

    registry.set(input, this);
  }

  static new<T extends StoreInput, R extends Dict<Relation> = EmptyObject>(
    input: T,
    config: Config<R> = {},
  ) {
    return new Store<T, R>(input, config);
  }

  get #as() {
    return {
      name: this.name,
      pk: this.#pk,
      types: this.#types,
    };
  }

  get collection() {
    const db = this.db;
    const name = this.name;
    const schema = this.#schema;
    const pk = this.#pk;
    return {
      create: () => db.schema.create(name, schema, pk),
      delete: () => db.schema.delete(name),
    };
  }

  get infer() {
    return undefined as unknown as InferRecord<T>;
  }

  get schema() {
    return this.#schema;
  }

  get type() {
    return this.#type;
  }

  [wrap](name: string, db: DB) {
    this.#db ??= db;
    this.#name ??= name;
    return this;
  }

  get db() {
    if (this.#db === undefined) throw E.db_missing();
    return this.#db;
  }

  get types() {
    return this.#types;
  }

  get name() {
    const name = this.#name;
    if (name === undefined) throw E.store_name_required();
    if (!VALID_IDENTIFIER.test(name)) throw E.identifier_invalid(name);
    return name;
  }

  #parse_query(query: Query, types: Types) {
    const { where, select, sort, limit } = query;

    if (where !== undefined) this.#parse_where(where, types);
    if (select !== undefined) this.#parse_select(select, types);
    if (sort !== undefined) this.#parse_sort(sort, types);
    if (limit !== undefined && !is.uint(limit)) throw E.limit_invalid();

  }

  #with(options?: With<R>) {
    if (options === undefined) return undefined;

    const plan: DBWith = {};

    for (const [name, query] of Object.entries(options)) {
      if (query === undefined) continue;

      const relation = this.#relations[name] as Relation | undefined;
      if (relation === undefined) throw E.relation_unknown(name);

      const store = registry.get(relation.schema);
      if (store === undefined) throw E.unregistered_schema();

      const { pk: target_pk } = parse(relation.schema);
      const target_types = store.types;

      const base = {
        as: { name: store.name, pk: target_pk, types: target_types },
        kind: relation.type,
        fk: relation.fk,
        reverse: "reverse" in relation && relation.reverse === true,
      };

      if (query === true) {
        plan[name] = { ...base, where: {} };
        continue;
      }

      this.#parse_query(query, target_types);

      plan[name] = {
        ...base,
        where: query.where ?? {},
        fields: query.select ? [...query.select] : undefined,
        sort: query.sort,
        limit: query.limit,
      };
    }

    return plan;
  }

  #parse_where(where: unknown, types: Types) {
    if (!is.dict(where)) throw E.where_invalid();

    for (const [k, value] of Object.entries(where)) {
      if (!VALID_IDENTIFIER.test(k)) throw E.identifier_invalid(k);
      if (!(k in types)) throw E.field_unknown(k, "where");
      if (value === undefined) throw E.field_undefined(k, "where");

      const datatype = types[k];

      // null criteria (IS NULL semantics)
      if (value === null) continue;

      // arrays are always invalid
      if (is.array(value)) throw E.where_invalid_value(k, value);

      if (is.dict(value)) {
        const ops = Object.entries(value);
        if (ops.length === 0) throw E.operator_empty(k);

        for (const [op, op_val] of ops) {
          if (op_val === undefined) throw E.field_undefined(k, "where");

          if (datatype === "string" || datatype === "time") {
            if (!STRING_OPS.includes(op)) throw E.operator_unknown(k, op);
            if (!is.string(op_val)) throw E.operator_type_string(k, op, op_val);
            continue;
          }

          if (is_number_key(datatype)) {
            if (!NUMBER_OPS.includes(op)) throw E.operator_unknown(k, op);
            if (!is.number(op_val)) throw E.operator_type_number(k, op, op_val);
            continue;
          }

          if (is_bigint_key(datatype)) {
            if (!BIGINT_OPS.includes(op)) throw E.operator_unknown(k, op);
            if (!is.bigint(op_val)) throw E.operator_type_bigint(k, op, op_val);
            continue;
          }

          if (datatype === "datetime") {
            if (!DATE_OPS.includes(op)) throw E.operator_unknown(k, op);
            if (!is.date(op_val)) throw E.operator_type_date(k, op, op_val);
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
          if (!is.string(value)) throw E.where_invalid_value(k, value);
          continue;
        case "u8": case "u16": case "u32":
        case "i8": case "i16": case "i32":
        case "f32": case "f64":
          if (!is.number(value)) throw E.where_invalid_value(k, value);
          continue;
        case "u64": case "u128": case "i64": case "i128":
          if (!is.bigint(value)) throw E.where_invalid_value(k, value);
          continue;
        case "datetime":
          if (!is.date(value)) throw E.where_invalid_value(k, value);
          continue;
        case "boolean":
          if (!is.boolean(value)) throw E.where_invalid_value(k, value);
          continue;
        case "url":
          if (!is.url(value)) throw E.where_invalid_value(k, value);
          continue;
        case "blob":
          if (!is.blob(value)) throw E.where_invalid_value(k, value);
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
      if (!(v in types)) throw E.field_unknown(v, "select");
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
      if (!(k in types)) throw E.field_unknown(k, "sort");
      const l = direction.toLowerCase();
      if (l !== "asc" && l !== "desc") throw E.sort_invalid_value(k, direction);
    }
  }

  #parse_insert(record: Dict) {
    for (const [k, v] of Object.entries(record)) {
      if (!(k in this.#types)) throw E.field_unknown(k, "insert");
      if (v === undefined) throw E.field_undefined(k, "insert");
      if (v === null) throw E.null_not_allowed(k);
    }
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
  async has(pkv: PrimaryKeyValue<T>) {
    if (this.#pk === null) throw E.pk_undefined(this.name);
    return (await this.count({ where: { [this.#pk]: pkv } as Where<T> })) === 1;
  }

  /**
   * Get a record by primary key.
   *
   * - Without options: returns the full base record.
   * - With `select`: returns a projected record.
   * - With `with`: augments the record with relations.
   */
  get(pkv: PrimaryKeyValue<T>): Promise<Schema<T>>;
  get<
    const S extends Select<Schema<T>> | undefined = undefined,
    const W extends With<R> | undefined = undefined,
  >(
    pkv: PrimaryKeyValue<T>,
    options: {
      select?: S;
      with?: W;
    },
  ): Promise<WithRelations<Projected<Schema<T>, S>, R, W>>;
  async get(
    pkv: PrimaryKeyValue<T>,
    options?: { select?: readonly string[]; with?: With<R> },
  ) {
    const pk = this.#pk;
    if (pk === null) throw E.pk_undefined(this.name);

    guard_options(options, ["select", "with"]);
    this.#parse_query(options ?? {}, this.#types);

    const $with = this.#with(options?.with);
    const records = await this.db.read(this.#as, {
      where: { [pk]: pkv },
      fields: options?.select ? [...options.select] : undefined,
      with: $with,
    });

    assert.true(records.length <= 1);

    if (records.length === 0) {
      const err = E.record_not_found(pk, pkv);
      (err as any).not_found = true;
      throw err;
    }

    const raw = records[0] as Dict;

    // if projected, keep it as-is (no parse)
    if (options?.select) return raw;

    // parse *only* base fields (exclude relation keys)
    const base_only = Object.fromEntries(Object.entries(raw)
      .filter(([k]) => k in this.#types));
    const parsed = this.#type.parse(base_only) as Dict;

    if ($with === undefined) return parsed;

    return {
      ...parsed,
      ...Object.fromEntries(Object.keys($with).map(k => [k, raw[k]])),
    };
  }

  /**
   * Try to get a record by primary key.
   */
  try(pkv: PrimaryKeyValue<T>): Promise<Schema<T> | undefined>;
  try<
    const S extends Select<Schema<T>> | undefined = undefined,
    const W extends With<R> | undefined = undefined,
  >(
    pkv: PrimaryKeyValue<T>,
    options: {
      select?: S;
      with?: W;
    },
  ): Promise<WithRelations<Projected<Schema<T>, S>, R, W> | undefined>;
  async try(
    pkv: PrimaryKeyValue<T>,
    options?: { select?: readonly string[]; with?: With<R> },
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

    this.#parse_insert(record);

    const types = this.#types;
    const pk = this.#pk;
    let to_insert = record;

    if (pk !== null && !(pk in record)) {
      const last_id = await this.db.lastId({ name: this.name, pk, types });
      const type = types[pk];

      const pk_value =
        type === "string"
          ? crypto.randomUUID()
          : ["u128", "u64"].includes(type)
            ? (BigInt(last_id) as bigint) + 1n
            : (last_id as number) + 1;

      to_insert = { ...record, [pk]: pk_value };
    }

    const entries = Object.entries(to_insert);
    const to_parse = Object.fromEntries(
      entries.filter(([k, v]) => !(v === null && this.#nullables.has(k))),
    );

    return this.db.create(this.#as, this.#type.parse(to_parse));
  }

  /**
   * Update a single record by primary key.
   */
  update(pkv: PrimaryKeyValue<T>, options: { set: $Set<T> }): Promise<void>;

  /**
   * Update multiple records (requires non-empty where).
   */
  update(options: { where?: Where<T>; set: $Set<T> }): Promise<number>;

  async update(
    arg0: PrimaryKeyValue<T> | { where?: Where<T>; set: $Set<T> },
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
      if (!(k in this.#types)) throw E.field_unknown(k, "set");
      if (v === null && !this.#nullables.has(k)) throw E.null_not_allowed(k);
    }

    const entries = Object.entries(set);
    const to_parse = Object.fromEntries(entries
      .filter(([key, value]) => value !== null || !this.#nullables.has(key)));
    const nulls = Object.fromEntries(entries
      .filter(([key, value]) => value === null && this.#nullables.has(key)));

    const parsed = {
      ...this.#type.partial().parse(to_parse),
      ...nulls,
    } as $Set<T>;

    if (by_pk) {
      return this.#update_1(arg0 as PrimaryKeyValue<T>, parsed);
    }

    const where = (arg0 as { where?: Where<T>; set: $Set<T> }).where;
    if (where !== undefined) this.#parse_where(where, this.#types);

    return this.#update_n((where ?? {}) as Where<T>, parsed);
  }

  async #update_1(pkv: PrimaryKeyValue<T>, set: $Set<T>) {
    const pk = this.#pk;
    if (pk === null) throw E.pk_undefined(this.name);

    const n = await this.db.update(this.#as, {
      set: set,
      where: { [pk]: pkv },
    });

    assert.true(n === 1, `${n} records updated instead of 1`);
  }

  async #update_n(where: Where<T>, set: $Set<T>) {
    return await this.db.update(this.#as, {
      set: set,
      where: where,
    });
  }

  /**
   * Delete a single record by primary key.
   */
  delete(pkv: PrimaryKeyValue<T>): Promise<void>;

  /**
   * Delete multiple records (requires non-empty where).
   */
  delete(options: { where: Where<T> }): Promise<number>;

  async delete(pkv_or_options: PrimaryKeyValue<T> | { where: Where<T> }) {
    if (is.dict(pkv_or_options)) {
      const where = pkv_or_options.where as Where<T>;
      if (!is.dict(where) || is.empty(where)) throw E.where_required();
      this.#parse_where(where, this.#types);
      return this.#delete_n(where);
    }

    return this.#delete_1(pkv_or_options as PrimaryKeyValue<T>);
  }

  async #delete_1(pkv: PrimaryKeyValue<T>) {
    const pk = this.#pk;
    if (pk === null) throw E.pk_undefined(this.name);

    const n = await this.db.delete(this.#as, { where: { [pk]: pkv } });
    assert.true(n === 1, `${n} records deleted instead of 1`);
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
    const W extends With<R> | undefined = undefined,
  >(
    options?: {
      where?: Where<T>;
      select?: S;
      sort?: Sort<Schema<T>>;
      limit?: number;
      with?: W;
    },
  ): Promise<WithRelations<Projected<Schema<T>, S>, R, W>[]> {
    guard_options(options, ["where", "select", "sort", "limit", "with"]);

    this.#parse_query(options ?? {}, this.#types);

    const result = await this.db.read(this.#as, {
      where: options?.where ?? {},
      fields: options?.select ? [...options.select] : undefined,
      limit: options?.limit,
      sort: options?.sort as ReadSort | undefined,
      with: this.#with(options?.with),
    });

    return result as never;
  }

  toJSON() {
    return this.#type.toJSON();
  }

  extend<A extends Dict>(extensor: (This: this) => A): this & A {
    const extensions = extensor(this);
    const keys = Object.keys(extensions);

    for (const k of keys) if (k in this) throw E.key_duplicate(k);

    Object.assign(this, extensions);
    return this as this & A;
  }
}
