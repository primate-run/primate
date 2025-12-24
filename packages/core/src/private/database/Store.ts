import type Changeset from "#database/Changeset";
import type Database from "#database/Database";
import type Schema from "#database/Schema";
import wrap from "#database/symbol/wrap";
import type Types from "#database/Types";
import fail from "#fail";
import assert from "@rcompat/assert";
import type { Dict, Serializable } from "@rcompat/type";
import type { Id, InferStore, StoreId, StoreSchema } from "pema";
import StoreType from "pema/StoreType";
import is from "@rcompat/is";

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

type Criteria<T extends StoreSchema> = X<{
  // any criterion key can be omitted; if present, it can be a value or null
  [K in keyof Omit<InferStore<T>, "id">]?: QueryOperators<InferStore<T>[K]>
} & {
  id?: StoreId<T> | null;
}>;

type Select<T> = {
  [K in keyof T]?: true;
};
type Sort<T> = {
  [K in keyof T]?: "asc" | "desc";
};

type Insertable<T extends StoreSchema> =
  Omit<InferStore<T>, "id"> & { id?: StoreId<T> };

type Filter<A, B = undefined> = B extends undefined ? A : {
  [K in keyof A as K extends keyof B
  ? B[K] extends true ? K : never : never
  ]: A[K];
};

type Config = {
  database?: Database;
  name?: string;
};

/**
 * Database-backed store.
 *
 * A `DatabaseStore` exposes a typed, validated interface over a relational or
 * document database table/collection. It pairs a Pema schema with a uniform
 * CRUD/query API.
 *
 */
export default class DatabaseStore<S extends StoreSchema>
  implements Serializable {
  #schema: S;
  #type: StoreType<S>;
  #types: Types;
  #nullables: Set<string>;
  #database?: Database;
  #name?: string;

  declare readonly Schema: Schema<S>;

  constructor(schema: S, config: Config = {}) {
    this.#schema = schema;
    this.#type = new StoreType(schema);
    this.#types = Object.fromEntries(Object.entries(schema)
      .map(([key, value]) => [key, value.datatype]));
    this.#name = config.name;
    this.#database = config.database;
    this.#nullables = new Set(
      Object.entries(this.#type.properties)
        .filter(([, v]) => v.nullable)
        .map(([k]) => k),
    );
  }

  #parseCriteria(criteria: Criteria<S>) {
    for (const [field, value] of Object.entries(criteria)) {
      if (!(field in this.#types)) throw fail("unknown field {0}", field);

      // skip null/undefined values
      if (value === null) continue;

      // if it's an operator object, validate
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

  static new<S extends StoreSchema>(schema: S, config: Config = {}) {
    return new DatabaseStore<S>(schema, config);
  }

  get #as() {
    return {
      name: this.name,
      types: this.#types,
    };
  }

  get collection() {
    const database = this.database;
    const name = this.name;
    const schema = this.#schema;
    return {
      create: () => database.schema.create(name, schema),
      delete: () => database.schema.delete(name),
    };
  }

  get infer() {
    return undefined as unknown as InferStore<S>;
  }

  get schema() {
    return this.#schema;
  }

  get type() {
    return this.#type;
  }

  [wrap](name: string, database: Database) {
    this.#database ??= database;
    this.#name ??= name;

    return this;
  }

  get database() {
    if (this.#database === undefined) throw fail("store missing database");
    return this.#database;
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
   *
   * @param criteria Criteria to limit which records are counted.
   * @returns Number of matching records (or total if no criteria given).
   */
  async count(criteria?: Criteria<S> | { id: StoreId<S> }) {
    assert.maybe.dict(criteria);
    if (criteria) this.#parseCriteria(criteria);

    return (await this.database.read(this.#as, {
      count: true,
      criteria: criteria ?? {},
    }));
  }

  /**
   * Check whether a record with the given id exists.
   *
   * @param id Record id.
   * @returns `true` if a record with the given id exists, otherwise `false`.
   */
  async has(id: StoreId<S>) {
    assert.string(id);

    // invariant: ids are primary keys and must be unique.
    // if the driver ever returns more than one record, assert will fail.
    // public contract remains just "true if it exists, false otherwise".
    return (await this.count({ id })) === 1;
  }

  /**
   * Get a record by id.
   *
   * @param id Record id.
   * @throws If no record with the given id exists.
   * @returns The record for the given id.
   */
  async get(id: Id): Promise<Schema<S>> {
    assert.string(id);

    const records = await this.database.read(this.#as, {
      criteria: { id },
      limit: 1,
    });

    assert.true(records.length <= 1);

    if (records.length === 0) throw fail("no record with id {0}", id);

    return this.#type.parse(records[0]) as Schema<S>;
  }

  /**
   * Try to get a record by id.
   *
   * @param id Record id.
   * @returns The record if found, otherwise `undefined`.
   */
  async try(id: Id): Promise<Schema<S> | undefined> {
    assert.string(id);

    try {
      return await this.get(id);
    } catch {
      return undefined;
    }
  }

  /**
   * Insert a single record.
   *
   * If `id` is omitted, the driver generates one. Input is validated
   * according to the store schema.
   *
   * @param record Record to insert (id optional).
   * @throws If a record with the same id already exists or validation fails.
   * @returns The inserted record with id.
   */
  async insert(record: Insertable<S>): Promise<Schema<S>> {
    assert.dict(record);

    return this.database.create(this.#as, { record: this.#type.parse(record) });
  }

  /**
   * Update a single record.
   *
   * Change semantics:
   * - missing / undefined -> leave field unchanged
   * - null -> unset field (only for nullable fields, otherwise throw)
   * - value -> set field to value
   *
   * Change input is validated according to the store schema.
   *
   * @param id Record id.
   * @param changeset Changeset per the rules above.
   * @throws If the id is missing, `.id` is present in `changeset`, attempting
   * to unset a non-nullable field, validation fails, or no record is updated.
   */
  update(id: Id, changeset: Changeset<S>): Promise<void>;

  /**
   * Update multiple records.
   *
   * Same change semantics as when updating a single record.
   *
   * @param criteria Criteria selecting which records to update.
   * @param changeset Changeset per the rules above.
   * @returns Number of updated records (may be 0).
   */
  update(
    criteria: Criteria<S>,
    changeset: Changeset<S>,
  ): Promise<number>;

  async update(
    criteria: Criteria<S> | Id,
    changeset: Changeset<S>,
  ) {
    assert.true(is.string(criteria) || is.dict(criteria));
    assert.dict(changeset);

    if ("id" in changeset) throw fail("{0} cannot be updated", ".id");

    const changeset_entries = Object.entries(changeset);
    for (const [k, v] of changeset_entries) {
      if (v === null && !this.#nullables.has(k)) {
        throw fail(".{0}: null not allowed (field not nullable)", k);
      }
    }
    const toParse = Object.fromEntries(changeset_entries
      .filter(([key, value]) => value !== null || !this.#nullables.has(key)),
    );
    const nulls = Object.fromEntries(changeset_entries
      .filter(([key, value]) => value === null && this.#nullables.has(key)),
    );
    const parsed = {
      // parse delta, without nullable nulls
      ...this.#type.partial().parse(toParse),
      ...nulls,
    } as Changeset<S>;

    return typeof criteria === "string"
      ? this.#update_1(criteria, parsed)
      : this.#update_n(criteria, parsed);
  }

  async #update_1(id: Id, changeset: Changeset<S>) {
    assert.string(id);
    assert.dict(changeset);

    const n = await this.database.update(this.#as, {
      changeset: changeset,
      criteria: { id },
    });

    assert.true(n === 1, `${n} records updated instead of 1`);
  }

  async #update_n(criteria: Criteria<S>, changeset: Changeset<S>) {
    assert.dict(criteria);
    assert.dict(changeset);

    this.#parseCriteria(criteria);

    const count = await this.database.update(this.#as, {
      changeset: changeset,
      criteria,
    });

    return count;
  }

  /**
   * Delete a single record.
   *
   * @param id Record id.
   * @throws If no records with the given id exists.
   */
  delete(id: Id): Promise<void>;

  /**
   * Delete multiple records.
   *
   * @param criteria Criteria selecting which records to delete.
   * @returns Number of records deleted (may be 0).
   */
  delete(criteria: Criteria<S>): Promise<number>;

  async delete(criteria: Criteria<S> | Id) {
    return typeof criteria === "string"
      ? this.#delete_1(criteria)
      : this.#delete_n(criteria);
  }

  async #delete_1(id: Id) {
    assert.string(id);

    const n = await this.database.delete(this.#as, { criteria: { id } });

    assert.true(n === 1, `${n} records deleted instead of 1`);
  }

  async #delete_n(criteria: Criteria<S>) {
    assert.dict(criteria);

    this.#parseCriteria(criteria);

    return await this.database.delete(this.#as, { criteria });
  }

  /**
   * Find matching records.
   *
   * @param criteria Criteria to match records by.
   * @param options Query options.
   * @returns Matching records, possibly projected/limited/sorted.
   */
  find(criteria: Criteria<S>): Promise<Filter<Schema<S>>[]>;
  find(
    criteria: Criteria<S>,
    options: {
      limit?: number;
      select?: undefined;
      sort?: Sort<Schema<S>>;
    }
  ): Promise<Filter<Schema<S>>[]>;
  find<F extends Select<Schema<S>>>(
    criteria: Criteria<S>,
    options?: {
      limit?: number;
      select?: F;
      sort?: Sort<Schema<S>>;
    }
  ): Promise<Filter<Schema<S>, F>[]>;
  async find<F extends Select<Schema<S>>>(
    criteria: Criteria<S>,
    options?: {
      limit?: number;
      select?: Select<Schema<S>>;
      sort?: Sort<Schema<S>>;
    },
  ) {
    assert.dict(criteria);
    this.#parseCriteria(criteria);
    assert.maybe.dict(options);
    assert.maybe.dict(options?.select);
    assert.maybe.dict(options?.sort);
    assert.maybe.uint(options?.limit);

    const result = await this.database.read(this.#as, {
      criteria,
      fields: options?.select ? Object.keys(options.select) : undefined,
      limit: options?.limit,
      sort: options?.sort as Dict<"asc" | "desc">,
    });

    return result as Filter<Schema<S>, F>[];
  };

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

  /**
   * *Create a custom query.*
   *
   * @returns a buildable query
  */
  /*query(): Query<S> {
    return new Query(this.#schema);
  }*/
};
