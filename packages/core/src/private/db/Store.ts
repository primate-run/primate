import AppError from "#AppError";
import type Changes from "#db/Changes";
import type Database from "#db/Database";
import type DataRecord from "#db/DataRecord";
import InMemoryDatabase from "#db/InMemoryDatabase";
//import Query from "#db/Query";
import derive from "#db/symbol/derive";
import type Types from "#db/Types";
import is from "@rcompat/assert/is";
import maybe from "@rcompat/assert/maybe";
import type Id from "pema/Id";
import type InferStore from "pema/InferStore";
import type StoreId from "pema/StoreId";
import type StoreSchema from "pema/StoreSchema";
import StoreType from "pema/StoreType";
import assert from "@rcompat/assert";

type X<T> = {
  [K in keyof T]: T[K]
} & {};
type Criteria<T extends StoreSchema> = X<Partial<InferStore<T>>>;

type Select<T> = {
  [K in keyof T]?: true;
};
type Sort<T> = {
  [K in keyof T]?: "asc" | "desc";
};

type Insertable<T extends StoreSchema> =
  Omit<DataRecord<T>, "id"> & { id?: StoreId<T> };

type Filter<A, B = undefined> = B extends undefined ? A : {
  [K in keyof A as K extends keyof B
    ? B[K] extends true ? K : never : never
  ]: A[K];
};

type Config = {
  name?: string;
  db?: Database;
};

export default class Store<S extends StoreSchema> {
  #schema: S;
  #type: StoreType<S>;
  #config: Config;
  #types: Types;
  #db: Database;

  constructor(schema: S, config?: Config) {
    this.#schema = schema;
    this.#type = new StoreType(schema);
    this.#config = config ?? {};
    this.#types = Object.fromEntries(Object.entries(schema)
      .map(([key, value]) => [key, value.datatype]));
    this.#db = this.#config.db ?? new InMemoryDatabase();
  }

  get #as() {
    return {
      name: this.name,
      types: this.#types,
    };
  }

  get schema() {
    const db = this.db;
    const name = this.#config.name!;
    const schema = this.#schema;
    return {
      create: () => db.schema.create(name, schema),
      delete: () => db.schema.delete(name),
    };
  }

  get infer() {
    return undefined as unknown as InferStore<S>;
  }

  derive(name: string, db: Database) {
    const _name = this.#config.name;

    return new Store(this.#schema, { name: _name ?? name, db });
  }

  [derive](name: string, db: Database) {
    const _name = this.#config.name;

    return new Store(this.#schema, {
      name: this.#config.name ?? name,
      db: this.#config.db ?? db,
    });
  }

  get db() {
    return this.#db;
  }

  get types() {
    return this.#types;
  }

  get name() {
    if (this.#config.name === undefined) {
      throw new AppError("store missing name");
    }
    return this.#config.name;
  }

  static new <S extends StoreSchema>(schema: S, config?: Config) {
    return new Store<S>(schema, config);
  }

  /**
   * *Count records.*
   * @param criteria criteria to limit records by
   * @returns the number of records if given criteria, otherwise all
   */
  async count(criteria?: Criteria<S>) {
    maybe(criteria).object();

    return (await this.db.read(this.#as, {
      criteria: criteria ?? {},
      count: true,
    }));
  }

  /**
   * *Check whether a record with the given id exists.*
   * @param id the record id
   * @returns *true* if a record with the given id exists
   */
  async exists(id: Id) {
    is(id).string();

    // @ts-expect-error type
    return (await this.count({ id })) === 1;
  }

  /**
   * *Get a single record with the given id.*
   * @param id the record id
   * @throws if a record with given id does not exist
   * @returns the record for the given id
   */
  async get(id: Id): Promise<DataRecord<S>> {
    is(id).string();

    const [record] = await this.db.read(this.#as, {
      criteria: { id },
      limit: 1,
    });

    return this.#type.validate(record);
  }

  /**
   * *Insert a single record.*
   *
   * @param record the record to insert, will generate id if missing
   * @throws if the record id exists in the store
   * @returns the inserted record
   */
  async insert(record: Insertable<S>): Promise<DataRecord<S>> {
    is(record).object();

    return this.db.create(this.#as, { record: this.#type.validate(record) });
  }

  /**
   * *Update a single record.*
   *
   * When updating a record, any field in the *changes* parameter that is
   * - **undefined** or missing, is unaffected
   * - **null**, is unset
   * - present but not **null** or **undefined**, is set
   *
   * @param id the record id
   * @param changes changes to the record, see above
   * @throws if the given id does not exist in the store
   */
  update(id: Id, changes: Changes<S>): Promise<void>;

  /**
   * *Update multiple records.*
   *
   * When updating records, any field in the *changes* parameter that is
   * - **undefined** or missing, is unaffected
   * - **null**, is unset
   * - present but not **null** or **undefined**, is set
   *
   * @param criteria criteria for updating record
   * @param changes changes to the record, see above
   * @returns the number of updated records
   */
  update(criteria: Criteria<S>, changes: Changes<S>): Promise<number>;

  async update(
    criteria: Id | Criteria<S>,
    changes: Changes<S>,
  ) {
    is(changes).object();

    return typeof criteria === "string"
      ? this.#update_1(criteria, changes)
      : this.#update_n(criteria, changes);
  }

  async #update_1(id: Id, changes: Changes<S>) {
    is(id).string();

    const count = await this.db.update(this.#as, {
      criteria: { id },
      changes,
      limit: 1,
    });

    assert(count === 1);
  }

  async #update_n(criteria: Criteria<S>, changes: Changes<S>) {
    is(criteria).object();

    const count = await this.db.update(this.#as, {
      criteria,
      changes,
    });

    return count;
  }

  /**
   * *Delete a single record.*
   *
   * @param id the record id
   * @throws if the given id does not exist in the store
   */
  delete(id: Id): Promise<void>;

  /**
   * *Delete multiple records.*
   *
   * @param criteria criteria for updating records
   * @returns the number of deleted records
   */
  delete(criteria: Criteria<S>): Promise<number>;

  async delete(criteria: Id | Criteria<S>) {
    return typeof criteria === "string"
      ? this.#delete_1(criteria)
      : this.#delete_n(criteria);
  }

  async #delete_1(id: Id) {
    is(id).string();

    const n = await this.db.delete(this.#as, { criteria: { id } });

    if (n !== 1) {
      new AppError(`${n} records deleted instead of 1`);
    }
  }

  async #delete_n(criteria: Criteria<S>) {
    is(criteria).object();

    return await this.db.delete(this.#as, { criteria });
  }

  /**
   * *Find matching records.*
   *
   * @param criteria the search criteria
   * @param fields the selected fields
   *
   * @returns any record matching the criteria with its selected fields
   */
  find(criteria: Criteria<S>): Promise<Filter<DataRecord<S>>[]>;
  find<F extends Select<DataRecord<S>>>(
    criteria: Criteria<S>,
    options?: {
      select?: F;
      sort?: Sort<DataRecord<S>>;
      limit?: number;
    }
  ): Promise<Filter<DataRecord<S>, F>[]>;
  async find<F extends Select<DataRecord<S>>>(
    criteria: Criteria<S>,
    options?: {
      select?: Select<DataRecord<S>>;
      sort: Sort<DataRecord<S>>;
      limit?: number;
    },
  ): Promise<Filter<DataRecord<S>, F>[]> {
    is(criteria).object();
    maybe(options).object();
    maybe(options?.select).object();
    maybe(options?.sort).object();
    maybe(options?.limit).usize();

    const result = await this.db.read(this.#as, {
      criteria,
      fields: Object.keys(options?.select ?? {}),
      sort: options?.sort,
      limit: options?.limit,
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
