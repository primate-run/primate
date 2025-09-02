import AppError from "#AppError";
import type Changes from "#database/Changes";
import type Database from "#database/Database";
import type DataRecord from "#database/DataRecord";
import wrap from "#database/symbol/wrap";
import type Types from "#database/Types";
import assert from "@rcompat/assert";
import is from "@rcompat/assert/is";
import maybe from "@rcompat/assert/maybe";
import type Dict from "@rcompat/type/Dict";
import type Id from "pema/Id";
import type InferStore from "pema/InferStore";
import type StoreId from "pema/StoreId";
import type StoreSchema from "pema/StoreSchema";
import StoreType from "pema/StoreType";

type X<T> = {
  [K in keyof T]: T[K]
} & {};
type Criteria<T extends StoreSchema> = X<{
  // any criterion key can be omitted; if present, it can be a value or null
  [K in keyof Omit<InferStore<T>, "id">]?: InferStore<T>[K] | null
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
 * Database-backed Store for Primate.
 *
 * A `DatabaseStore` exposes a typed, validated interface over a relational or
 * document database table/collection. It pairs a Pema schema with a uniform
 * CRUD/query API.
 *
 */
export default class DatabaseStore<S extends StoreSchema> {
  #schema: S;
  #type: StoreType<S>;
  #types: Types;
  #nullables: Set<string>;
  #database?: Database;
  #name?: string;

  constructor(schema: S, config: Config = {}) {
    this.#schema = schema;
    this.#type = new StoreType(schema);
    this.#types = Object.fromEntries(Object.entries(schema)
      .map(([key, value]) => [key, value.datatype]));
    this.#name = config.name;
    this.#database = config.database;
    this.#nullables = new Set(
      Object.entries(this.#type.schema)
        .filter(([, v]) => v.nullable)
        .map(([k]) => k),
    );
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

  get schema() {
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

  [wrap](name: string, database: Database) {
    return new DatabaseStore(this.#schema, {
      database: this.#database ?? database,
      name: this.#name ?? name,
    });
  }

  get database() {
    if (this.#database === undefined) {
      throw new AppError("store missing database");
    }
    return this.#database;
  }

  get types() {
    return this.#types;
  }

  get name() {
    if (this.#name === undefined) {
      throw new AppError("store missing name");
    }
    return this.#name;
  }

  /**
   * Count records.
   *
   * @param criteria Criteria to limit which records are counted.
   * @returns Number of matching records (or total if no criteria given).
   */
  async count(criteria?: Criteria<S> | { id: StoreId<S> }) {
    maybe(criteria).object();

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
    is(id).string();

    // Invariant: ids are primary keys and must be unique.
    // If the driver ever returns more than one record, assert will fail.
    // Public contract remains just "true if it exists, false otherwise".
    return (await this.count({ id })) === 1;
  }

  /**
   * Get a record by id.
   *
   * @param id Record id.
   * @throws If no record with the given id exists.
   * @returns The record for the given id.
   */
  async get(id: Id): Promise<DataRecord<S>> {
    is(id).string();

    const records = await this.database.read(this.#as, {
      criteria: { id },
      limit: 1,
    });

    assert(records.length <= 1);

    if (records.length === 0) {
      throw new AppError("no record with id {0}", id);
    }

    return this.#type.parse(records[0]) as DataRecord<S>;
  }

  /**
   * Try to get a record by id.
   *
   * @param id Record id.
   * @returns The record if found, otherwise `undefined`.
   */
  async try(id: Id): Promise<DataRecord<S> | undefined> {
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
  async insert(record: Insertable<S>): Promise<DataRecord<S>> {
    is(record).object();

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
   * @param changes Partial changes per the rules above.
   * @throws If the id is missing, `.id` is present in `changes`, attempting to
   * unset a non-nullable field, validation fails, or no record is updated.
   */
  update(id: Id, changes: Changes<S>): Promise<void>;

  /**
   * Update multiple records.
   *
   * Same change semantics as when updating a single record.
   *
   * @param criteria Criteria selecting which records to update.
   * @param changes Partial changes per the rules above.
   * @returns Number of updated records (may be 0).
   */
  update(
    criteria: Criteria<S>,
    changes: Changes<S>,
  ): Promise<number>;

  async update(
    criteria: Criteria<S> | Id,
    changes: Changes<S>,
  ) {
    is(changes).object();

    if ("id" in changes) {
      throw new AppError("'.id' cannot be updated");
    }

    const changeEntries = Object.entries(changes);
    for (const [k, v] of changeEntries) {
      if (v === null && !this.#nullables.has(k)) {
        throw new AppError(`.${k}: null not allowed (field is not nullable)`);
      }
    }
    const toParse = Object.fromEntries(changeEntries
      .filter(([key, value]) => value !== null || !this.#nullables.has(key)),
    );
    const nulls = Object.fromEntries(changeEntries
      .filter(([key, value]) => value === null && this.#nullables.has(key)),
    );
    const parsed = {
      // parse delta, without nullable nulls
      ...this.#type.partial().parse(toParse),
      ...nulls,
    } as Changes<S>;

    return typeof criteria === "string"
      ? this.#update_1(criteria, parsed)
      : this.#update_n(criteria, parsed);
  }

  async #update_1(id: Id, changes: Changes<S>) {
    is(id).string();

    const n = await this.database.update(this.#as, {
      changes,
      criteria: { id },
    });

    assert(n === 1, `${n} records updated instead of 1`);
  }

  async #update_n(criteria: Criteria<S>, changes: Changes<S>) {
    is(criteria).object();

    const count = await this.database.update(this.#as, {
      changes,
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
    is(id).string();

    const n = await this.database.delete(this.#as, { criteria: { id } });

    assert(n === 1, `${n} records deleted instead of 1`);
  }

  async #delete_n(criteria: Criteria<S>) {
    is(criteria).object();

    return await this.database.delete(this.#as, { criteria });
  }

  /**
   * Find matching records.
   *
   * @param criteria Criteria to match records by.
   * @param options Query options.
   * @returns Matching records, possibly projected/limited/sorted.
   */
  find(criteria: Criteria<S>): Promise<Filter<DataRecord<S>>[]>;
  find(
    criteria: Criteria<S>,
    options: {
      limit?: number;
      select?: undefined;
      sort?: Sort<DataRecord<S>>;
    }
  ): Promise<Filter<DataRecord<S>>[]>;
  find<F extends Select<DataRecord<S>>>(
    criteria: Criteria<S>,
    options?: {
      limit?: number;
      select?: F;
      sort?: Sort<DataRecord<S>>;
    }
  ): Promise<Filter<DataRecord<S>, F>[]>;
  async find<F extends Select<DataRecord<S>>>(
    criteria: Criteria<S>,
    options?: {
      limit?: number;
      select?: Select<DataRecord<S>>;
      sort?: Sort<DataRecord<S>>;
    },
  ) {
    is(criteria).object();
    maybe(options).record();
    maybe(options?.select).object();
    maybe(options?.sort).record();
    maybe(options?.limit).usize();

    const result = await this.database.read(this.#as, {
      criteria,
      fields: options?.select ? Object.keys(options.select) : undefined,
      limit: options?.limit,
      sort: options?.sort as Dict<"asc" | "desc">,
    });

    return result as Filter<DataRecord<S>, F>[];
  };

  /**
   * *Create a custom query.*
   *
   * @returns a buildable query
  */
  /*query(): Query<S> {
    return new Query(this.#schema);
  }*/
};
