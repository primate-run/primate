import type DataDict from "#db/DataDict";
import type DB from "#db/DB";
import type { With as DBWith } from "#db/DB";
import wrap from "#db/symbol/wrap";
import type Types from "#db/Types";
import fail from "#fail";
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

function guard_options<
  T extends object,
  const K extends readonly (keyof T & string)[],
>(options: T | undefined, allowed: K) {
  if (options === undefined) return;

  const allowed_set = new Set<string>(allowed as readonly string[]);

  for (const k of Object.keys(options)) {
    if (!allowed_set.has(k)) throw fail("unknown option {0}", k);
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

function invalid_criteria(field: string) {
  return fail("invalid criteria for {0}", field);
}
function undefined_criteria(field: string) {
  return fail("undefined criteria for {0}", field);
}
function unknown_operator(operator: string) {
  return fail("unknown operator {0}", operator);
}
function unknown_field(field: string) {
  return fail("unknown field {0}", field);
}
function key_exists(key: string) {
  return fail("key {0} already exists on store", key);
}

const registry = new Map<Dict, Store<any>>();

const STRING_OPERATORS = ["$like", "$ilike"];
const NUMBER_OPERATORS = ["$gt", "$gte", "$lt", "$lte", "$ne"];
const BIGINT_OPERATORS = ["$gt", "$gte", "$lt", "$lte", "$ne"];
const DATE_OPERATORS = ["$before", "$after", "$ne"];

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
  #pk: string | null;
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
    return {
      create: () => db.schema.create(name, schema),
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
    if (this.#db === undefined) throw fail("store missing database");
    return this.#db;
  }

  get types() {
    return this.#types;
  }

  get name() {
    if (this.#name === undefined) throw fail("store missing name");
    return this.#name;
  }

  #with(options: With<R> | undefined): DBWith | undefined {
    if (options === undefined) return undefined;

    const plan: DBWith = {};

    for (const [name, query] of Object.entries(options)) {
      if (query === undefined) continue;

      const relation = this.#relations[name] as Relation | undefined;
      if (relation === undefined) throw fail("unknown relation {0}", name);

      const store = registry.get(relation.schema);
      if (store === undefined) throw fail("no store registered for schema");
      const target_types = store.types;
      const { pk: target_pk } = parse(relation.schema);

      const target_as = {
        name: store.name,
        pk: target_pk,
        types: target_types,
      };

      let where: Dict | undefined;
      let select: readonly string[] | undefined;
      let sort: Dict | undefined;
      let limit: number | undefined;

      if (query !== true) {
        assert.maybe.dict(query);
        assert.maybe.dict((query as any).where);
        assert.maybe.array((query as any).select);
        assert.maybe.dict((query as any).sort);
        assert.maybe.uint((query as any).limit);

        if ((query as any).where) where = (query as any).where;
        if ((query as any).select) select = (query as any).select;
        if ((query as any).sort) sort = (query as any).sort;
        if ((query as any).limit) limit = (query as any).limit;

        if (where) this.#validate_where(where, target_types);
        if (select) this.#validate_select(select, target_types);
        if (sort) this.#validate_sort(sort, target_types);
      }

      plan[name] = {
        as: target_as,
        kind: relation.type,
        fk: relation.fk,
        reverse: (relation as any).reverse === true,
        criteria: (where ?? {}) as DataDict,
        fields: select ? [...select] : undefined,
        sort: sort as ReadSort | undefined,
        limit,
      };
    }

    return plan;
  }

  #validate_where(where: Dict, types: Types) {
    for (const [field, value] of Object.entries(where)) {
      if (!(field in types)) throw unknown_field(field);
      if (value === undefined) throw undefined_criteria(field);

      const datatype = types[field];

      // null criteria (IS NULL semantics)
      if (value === null) continue;

      // arrays are always invalid
      if (Array.isArray(value)) throw invalid_criteria(field);

      if (is.dict(value)) {
        const ops = Object.entries(value);
        if (ops.length === 0) throw fail("empty operator object");

        for (const [op, op_value] of ops) {
          if (op_value === undefined) throw undefined_criteria(field);

          if (datatype === "string" || datatype === "time") {
            if (!STRING_OPERATORS.includes(op)) throw unknown_operator(op);
            if (!is.string(op_value)) throw fail("$(i)like must be a string");
            continue;
          }

          if (is_number_key(datatype)) {
            if (!NUMBER_OPERATORS.includes(op)) throw unknown_operator(op);
            if (!is.number(op_value)) throw invalid_criteria(field);
            continue;
          }

          if (is_bigint_key(datatype)) {
            if (!BIGINT_OPERATORS.includes(op)) throw unknown_operator(op);
            if (!is.bigint(op_value)) throw invalid_criteria(field);
            continue;
          }

          if (datatype === "datetime") {
            if (!DATE_OPERATORS.includes(op)) throw unknown_operator(op);
            if (!is.date(op_value)) throw invalid_criteria(field);
            continue;
          }

          // url/boolean/blob: no operator objects
          throw unknown_operator(op);
        }

        continue;
      }

      switch (datatype) {
        case "string":
        case "time":
          if (!is.string(value)) throw invalid_criteria(field);
          continue;
        case "u8": case "u16": case "u32":
        case "i8": case "i16": case "i32":
        case "f32": case "f64":
          if (!is.number(value)) throw invalid_criteria(field);
          continue;
        case "u64": case "u128": case "i64": case "i128":
          if (!is.bigint(value)) throw invalid_criteria(field);
          continue;
        case "datetime":
          if (!is.date(value)) throw invalid_criteria(field);
          continue;
        case "boolean":
          if (!is.boolean(value)) throw invalid_criteria(field);
          continue;
        case "url":
          if (!is.url(value)) throw invalid_criteria(field);
          continue;
        case "blob":
          if (!is.blob(value)) throw invalid_criteria(field);
          continue;
        default:
          throw invalid_criteria(field);
      }
    }
  }

  #validate_select(select: readonly unknown[], types: Types) {
    if (select.length === 0) throw fail("empty select");
    const seen = new Set<string>();
    for (const k of select) {
      if (typeof k !== "string") throw fail("select keys must be strings");
      if (!(k in types)) throw fail("unknown select field {0}", k);
      // duplicate isn't harmful, but it's usually a thought error
      if (seen.has(k)) throw fail("duplicate select field {0}", k);
      seen.add(k);
    }
  }

  #validate_sort(sort: Dict, types: Types) {
    const keys = Object.keys(sort);
    if (keys.length === 0) throw fail("empty sort");

    for (const [k, dir] of Object.entries(sort)) {
      if (!(k in types)) throw fail("unknown sort field {0}", k);
      if (dir !== "asc" && dir !== "desc") throw fail("invalid sort direction");
    }
  }

  #validate_inserted(record: Dict) {
    for (const [k, v] of Object.entries(record)) {
      if (!(k in this.#types)) throw unknown_field(k);
      if (v === undefined) throw fail("undefined value for {0}", k);
      if (v === null) {
        throw fail(".{0}: null is not allowed on insert; omit key instead", k);
      }
    }
  }

  /**
   * Count records
   */
  async count(options?: { where?: Where<T> }) {
    assert.maybe.dict(options);
    assert.maybe.dict(options?.where);
    if (options?.where) this.#validate_where(options.where, this.#types);

    return await this.db.read(this.#as, {
      count: true,
      criteria: (options?.where ?? {}),
    });
  }

  /**
   * Check whether a record with the given primary key exists.
   */
  async has(pkv: PrimaryKeyValue<T>) {
    const pk = this.#pk;
    if (pk === null) throw fail("store has no primary key");
    return (await this.count({ where: { [pk]: pkv } as Where<T> })) === 1;
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
    if (pk === null) throw fail("store has no primary key");

    assert.maybe.dict(options);
    guard_options(options, ["select", "with"]);
    assert.maybe.array(options?.select);

    if (options?.select) this.#validate_select(options.select, this.#types);

    const $with = this.#with(options?.with);

    const records = await this.db.read(this.#as, {
      criteria: { [pk]: pkv },
      fields: options?.select ? [...options.select] : undefined,
      limit: 1,
      with: $with,
    });

    assert.true(records.length <= 1);

    if (records.length === 0) {
      const err = fail("no record with {0} {1}", pk, pkv);
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
  ): Promise<any> {
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

    this.#validate_inserted(record);

    const pk = this.#pk;
    let to_insert = record;

    if (pk !== null && !(pk in record)) {
      const last_id = await this.db.lastId(this.name, pk);
      const type = this.#types[pk];

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
    const parsed = this.#type.parse(to_parse);

    return this.db.create(this.#as, { record: parsed });
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
    const set = (by_pk ? options.set : (arg0 as any).set) as $Set<T>;

    assert.dict(set);

    if (Object.keys(set).length === 0) throw fail("empty changeset");

    const pk = this.#pk;
    if (pk !== null && pk in set) throw fail("{0} cannot be updated", pk);

    for (const [k, v] of Object.entries(set)) {
      if (!(k in this.#types)) throw unknown_field(k);
      if (v === null && !this.#nullables.has(k)) {
        throw fail(".{0}: null not allowed (field not nullable)", k);
      }
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

    const where = (arg0 as any).where as Where<T> | undefined;
    assert.maybe.dict(where);

    if (where !== undefined) this.#validate_where(where, this.#types);

    return this.#update_n((where ?? {}) as Where<T>, parsed);
  }

  async #update_1(pkv: PrimaryKeyValue<T>, set: $Set<T>) {
    const pk = this.#pk;
    if (pk === null) throw fail("store has no primary key");

    const n = await this.db.update(this.#as, {
      changeset: set,
      criteria: { [pk]: pkv },
    });

    assert.true(n === 1, `${n} records updated instead of 1`);
  }

  async #update_n(where: Where<T>, set: $Set<T>) {
    return await this.db.update(this.#as, {
      changeset: set,
      criteria: where,
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
    if (is.dict(pkv_or_options) && "where" in pkv_or_options) {
      const where = (pkv_or_options as any).where as Where<T>;
      assert.dict(where);
      if (Object.keys(where).length === 0) throw fail("empty where");
      this.#validate_where(where, this.#types);
      return this.#delete_n(where);
    }

    return this.#delete_1(pkv_or_options as PrimaryKeyValue<T>);
  }

  async #delete_1(pkv: PrimaryKeyValue<T>) {
    const pk = this.#pk;
    if (pk === null) throw fail("store has no primary key");

    const n = await this.db.delete(this.#as, { criteria: { [pk]: pkv } });
    assert.true(n === 1, `${n} records deleted instead of 1`);
  }

  async #delete_n(where: Where<T>) {
    return await this.db.delete(this.#as, { criteria: where });
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
    assert.maybe.dict(options);
    guard_options(options, ["where", "select", "sort", "limit", "with"]);
    assert.maybe.dict(options?.where);
    assert.maybe.array(options?.select);
    assert.maybe.dict(options?.sort);
    assert.maybe.uint(options?.limit);

    if (options?.where) this.#validate_where(options.where, this.#types);
    if (options?.select) this.#validate_select(options.select, this.#types);
    if (options?.sort) this.#validate_sort(options.sort, this.#types);

    const result = await this.db.read(this.#as, {
      criteria: (options?.where ?? {}) as any,
      fields: options?.select ? [...(options.select as readonly string[])] : undefined,
      limit: options?.limit,
      sort: options?.sort as unknown as ReadSort,
      with: this.#with(options?.with),
    });

    return result as never;
  }

  toJSON() {
    return this.#type.toJSON();
  }

  extend<A extends Dict>(extensor: (This: this) => A): this & A {
    const extensions = extensor(this);

    for (const k of Object.keys(extensions)) if (k in this) throw key_exists(k);

    Object.assign(this, extensions);
    return this as this & A;
  }
}
