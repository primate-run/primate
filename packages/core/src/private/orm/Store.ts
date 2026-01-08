import type DB from "#db/DB";
import wrap from "#db/symbol/wrap";
import type Types from "#db/Types";
import fail from "#fail";
import type Changeset from "#orm/Changeset";
import type ForeignKey from "#orm/ForeignKey";
import parse from "#orm/parse";
import type {
  ExtractSchema,
  InferRecord,
  Insertable,
  PrimaryKeyField,
  Relation,
  StoreInput,
} from "#orm/types";
import assert from "@rcompat/assert";
import is from "@rcompat/is";
import type { Dict, Serializable } from "@rcompat/type";
import type { DataKey, Storable } from "pema";
import StoreType from "pema/StoreType";

type X<T> = {
  [K in keyof T]: T[K]
} & {};

type StringOperators = {
  $like?: string;
};

/*type NumberOperators = {
  $gte?: number;
  $gt?: number;
  $lte?: number;
  $lt?: number;
};*/

type QueryOperators<T> =
  T extends string ? T | StringOperators | null :
  //  T extends number ? T | NumberOperators | null :
  T | null;

type Criteria<T extends StoreInput> = X<{
  [K in keyof InferRecord<T>]?: QueryOperators<InferRecord<T>[K]>
}>;

type Select<T> = {
  [K in keyof T]?: true;
};

type Sort<T> = {
  [K in keyof T]?: "asc" | "desc";
};

type Filter<A, B = undefined> = B extends undefined ? A : {
  [K in keyof A as K extends keyof B
  ? B[K] extends true ? K : never : never
  ]: A[K];
};

type Config = {
  db?: DB;
  name?: string;
};

type Schema<T extends StoreInput> = X<InferRecord<T>>;

type PrimaryKeyValue<T extends StoreInput> =
  InferRecord<T>[PrimaryKeyField<T>];

/**
 * Database-backed store.
 *
 * A `Store` exposes a typed, validated interface over a relational or
 * document database table/collection. It pairs a Pema schema with a uniform
 * CRUD/query API.
 */
export default class Store<T extends StoreInput>
  implements Serializable {
  #schema: Dict<Storable<DataKey>>;
  #type: StoreType<ExtractSchema<T>>;
  #types: Types;
  #nullables: Set<string>;
  #db?: DB;
  #name?: string;
  #pk: string | null;
  #fks: Map<string, ForeignKey<Storable<DataKey>>>;
  #relations: Map<string, Relation>;

  declare readonly Schema: Schema<T>;

  constructor(input: T, config: Config = {}) {
    const { pk, fks, relations, schema } = parse(input);

    this.#schema = schema;
    this.#type = new StoreType(schema as ExtractSchema<T>);
    this.#types = Object.fromEntries(
      Object.entries(schema).map(([key, value]) => [key, value.datatype]),
    );
    this.#name = config.name;
    this.#db = config.db;
    this.#pk = pk;
    this.#fks = fks;
    this.#relations = relations;
    this.#nullables = new Set(
      Object.entries(this.#type.properties as Dict<{ nullable: boolean }>)
        .filter(([, v]) => v.nullable)
        .map(([k]) => k),
    );
  }

  #parseCriteria(criteria: Criteria<T>) {
    for (const [field, value] of Object.entries(criteria)) {
      if (!(field in this.#types)) throw fail("unknown field {0}", field);

      if (value === null) continue;

      if (typeof value === "object") {
        const type = this.#types[field];

        if ("$like" in value && type !== "string") {
          throw fail("$like operator not supported in {0} ({1})", field, type);
        }

        /*const n_ops = ["$gte", "$gt", "$lte", "$lt"];
        if (n_ops.some(op => op in value) && !["number", "i8", "i16", "i32",
          "i64", "i128", "u8", "u16", "u32", "u64", "u128", "f32", "f64"]
          .includes(type)) {
          const used = n_ops.filter(op => op in value).join(", ");
          throw fail("operators {0} not supported in {1} ({2})", used, field,
            type);
        }*/
      }
    }
  }

  static new<T extends StoreInput>(input: T, config: Config = {}) {
    return new Store<T>(input, config);
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

  /**
   * Count records.
   */
  async count(criteria?: Criteria<T>) {
    assert.maybe.dict(criteria);
    if (criteria) this.#parseCriteria(criteria);

    return await this.db.read(this.#as, {
      count: true,
      criteria: criteria ?? {},
    });
  }

  /**
   * Check whether a record with the given primary key exists.
   */
  async has(pkv: PrimaryKeyValue<T>) {
    const pk = this.#pk;
    if (pk === null) throw fail("store has no primary key");

    return (await this.count({ [pk]: pkv } as Criteria<T>)) === 1;
  }

  /**
   * Get a record by primary key.
   */
  async get(pkv: PrimaryKeyValue<T>): Promise<Schema<T>> {
    const pk = this.#pk;
    if (pk === null) throw fail("store has no primary key");

    const records = await this.db.read(this.#as, {
      criteria: { [pk]: pkv },
      limit: 1,
    });

    assert.true(records.length <= 1);

    if (records.length === 0) throw fail("no record with {0} {1}", pk, pkv);

    return this.#type.parse(records[0]) as unknown as Schema<T>;
  }

  /**
   * Try to get a record by primary key.
   */
  async try(pkv: PrimaryKeyValue<T>): Promise<Schema<T> | undefined> {
    try {
      return await this.get(pkv);
    } catch {
      return undefined;
    }
  }

  /**
   * Insert a single record.
   */
  async insert(record: Insertable<T>): Promise<Schema<T>> {
    assert.dict(record);

    const pk = this.#pk;
    let to_insert = record;

    if (pk !== null && !(pk in record)) {
      const lastId = await this.db.lastId(this.name, pk);
      const type = this.#types[pk];
      const pk_value = type === "string"
        ? crypto.randomUUID()
        : ["u128", "u64"].includes(type)
          ? (BigInt(lastId) as bigint) + 1n
          : (lastId as number) + 1;
      to_insert = { ...record, [pk]: pk_value };
    }

    return this.db.create(this.#as, { record: this.#type.parse(to_insert) });
  }

  /**
   * Update a single record by primary key.
   */
  update(pkv: PrimaryKeyValue<T>, changeset: Changeset<T>): Promise<void>;

  /**
   * Update multiple records.
   */
  update(criteria: Criteria<T>, changeset: Changeset<T>): Promise<number>;

  async update(
    criteria: Criteria<T> | PrimaryKeyValue<T>,
    changeset: Changeset<T>,
  ) {
    assert.dict(changeset);

    const pk = this.#pk;
    if (pk !== null && pk in changeset) {
      throw fail("{0} cannot be updated", pk);
    }

    const changeset_entries = Object.entries(changeset);
    for (const [k, v] of changeset_entries) {
      if (v === null && !this.#nullables.has(k)) {
        throw fail(".{0}: null not allowed (field not nullable)", k);
      }
    }

    const toParse = Object.fromEntries(
      changeset_entries.filter(
        ([key, value]) => value !== null || !this.#nullables.has(key),
      ),
    );
    const nulls = Object.fromEntries(
      changeset_entries.filter(
        ([key, value]) => value === null && this.#nullables.has(key),
      ),
    );
    const parsed = {
      ...this.#type.partial().parse(toParse),
      ...nulls,
    } as Changeset<T>;

    return is.dict(criteria)
      ? this.#update_n(criteria, parsed)
      : this.#update_1(criteria, parsed);
  }

  async #update_1(pkv: PrimaryKeyValue<T>, changeset: Changeset<T>) {
    const pk = this.#pk;
    if (pk === null) throw fail("store has no primary key");

    const n = await this.db.update(this.#as, {
      changeset,
      criteria: { [pk]: pkv },
    });

    assert.true(n === 1, `${n} records updated instead of 1`);
  }

  async #update_n(criteria: Criteria<T>, changeset: Changeset<T>) {
    assert.dict(criteria);

    this.#parseCriteria(criteria);

    return await this.db.update(this.#as, {
      changeset,
      criteria,
    });
  }

  /**
   * Delete a single record by primary key.
   */
  delete(pkv: PrimaryKeyValue<T>): Promise<void>;

  /**
   * Delete multiple records.
   */
  delete(criteria: Criteria<T>): Promise<number>;

  async delete(criteria: Criteria<T> | PrimaryKeyValue<T>) {
    return is.dict(criteria)
      ? this.#delete_n(criteria)
      : this.#delete_1(criteria);
  }

  async #delete_1(pkv: PrimaryKeyValue<T>) {
    const pk = this.#pk;
    if (pk === null) throw fail("store has no primary key");

    const n = await this.db.delete(this.#as, { criteria: { [pk]: pkv } });

    assert.true(n === 1, `${n} records deleted instead of 1`);
  }

  async #delete_n(criteria: Criteria<T>) {
    assert.dict(criteria);

    this.#parseCriteria(criteria);

    return await this.db.delete(this.#as, { criteria });
  }

  /**
   * Find matching records.
   */
  find(criteria: Criteria<T>): Promise<Filter<Schema<T>>[]>;
  find(
    criteria: Criteria<T>,
    options: {
      limit?: number;
      select?: undefined;
      sort?: Sort<Schema<T>>;
    },
  ): Promise<Filter<Schema<T>>[]>;
  find<F extends Select<Schema<T>>>(
    criteria: Criteria<T>,
    options?: {
      limit?: number;
      select?: F;
      sort?: Sort<Schema<T>>;
    },
  ): Promise<Filter<Schema<T>, F>[]>;
  async find<F extends Select<Schema<T>>>(
    criteria: Criteria<T>,
    options?: {
      limit?: number;
      select?: Select<Schema<T>>;
      sort?: Sort<Schema<T>>;
    },
  ) {
    assert.dict(criteria);
    this.#parseCriteria(criteria);
    assert.maybe.dict(options);
    assert.maybe.dict(options?.select);
    assert.maybe.dict(options?.sort);
    assert.maybe.uint(options?.limit);

    const result = await this.db.read(this.#as, {
      criteria,
      fields: options?.select ? Object.keys(options.select) : undefined,
      limit: options?.limit,
      sort: options?.sort as Dict<"asc" | "desc">,
    });

    return result as Filter<Schema<T>, F>[];
  }

  toJSON() {
    return this.#type.toJSON();
  }

  extend<A extends Dict>(extensor: (This: this) => A): this & A {
    const extensions = extensor(this);

    for (const k of Object.keys(extensions)) {
      if (k in this) throw fail("key {0} already exists on store", k);
    }

    Object.assign(this, extensions);
    return this as this & A;
  }
}
