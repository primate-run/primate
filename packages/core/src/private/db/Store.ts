import AppError from "#AppError";
import type Changes from "#db/Changes";
import type Database from "#db/Database";
import type Document from "#db/Document";
import InMemoryDatabase from "#db/InMemoryDatabase";
import Query from "#db/Query";
import derive from "#db/symbol/derive";
import type Types from "#db/Types";
import is from "@rcompat/assert/is";
import maybe from "@rcompat/assert/maybe";
import type Id from "pema/Id";
import type InferStore from "pema/InferStore";
import type StoreId from "pema/StoreId";
import type StoreSchema from "pema/StoreSchema";
import StoreType from "pema/StoreType";

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
  Omit<Document<T>, "id"> & { id?: StoreId<T> };

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
      throw new AppError("Store missing name");
    }
    return this.#config.name;
  }

  static new <S extends StoreSchema>(schema: S, config?: Config) {
    return new Store<S>(schema, config);
  }

  /**
   * *Check whether a document with the given id exists in the store.*
   * @param id the document id
   * @returns *true* if a document with the given id exists
   */
  async exists(id: Id) {
    is(id).string();

    return (await this.db.read(this.#as, {
      criteria: { id },
      count: true,
    })) === 1;
  }

  /**
   * *Get a single document with the given id from the store.*
   * @param id the document id
   * @throws if a document with given id does not exist
   * @returns the document for the given id
   */
  async get(id: Id): Promise<Document<S>> {
    is(id).string();

    const [document] = await this.db.read(this.#as, {
      criteria: { id },
      limit: 1,
    });

    return this.#type.validate(document);
  }

  /**
   * *Insert a document into the store.*
   *
   * @param document the document to insert, will generate id if missing
   * @throws if the document id exists in the store
   * @returns the inserted document
   */
  async insert(document: Insertable<S>): Promise<Document<S>> {
    is(document).object();

    return this.db.create(this.#as, {
      document: this.#type.validate(document),
    });
  }

  /**
   * *Update a document in the store.*
   *
   * When updating a document, any field in the *changes* parameter that is
   * - **undefined** or missing, is unaffected
   * - **null**, is unset
   * - present but not **null** or **undefined**, is set
   *
   * @param id the document id
   * @param changes changes to the document, see above
   * @throws if the given id does not exist in the store
   * @returns the updated document
   */
  async update(id: Id, changes: Changes<S>): Promise<Document<S>> {
    is(id).string();
    is(changes).object();

    // to do: validate optionally: this.#type.validate(document, { partial: true })

    const [document] = await this.db.update(this.#as, {
      criteria: { id },
      delta: changes,
      limit: 1,
    });

    return document as Document<S>;
  }

  /**
   * *Delete a document from the store.*
   *
   * @param id the document id
   * @throws if the given id does not exist in the store
   */
  async delete(id: Id): Promise<void> {
    is(id).string();

    await this.db.delete(this.#as, {
      criteria: { id },
    });
  }

  /**
   * *Find matching documents.*
   *
   * @param criteria the search criteria
   * @param fields the selected fields
   *
   * @returns any documents matching the criteria, with their selected fields
   */
  find(criteria: Criteria<S>): Promise<Filter<Document<S>>[]>;
  find<F extends Select<Document<S>>>(
    criteria: Criteria<S>,
    options?: {
      select?: F;
      sort?: Sort<Document<S>>;
    }
  ): Promise<Filter<Document<S>, F>[]>;
  async find<F extends Select<Document<S>>>(
    criteria: Criteria<S>,
    options?: {
      select?: Select<Document<S>>;
      sort: Sort<Document<S>>;
    },
  ): Promise<Filter<Document<S>, F>[]> {
    is(criteria).object();
    maybe(options).object();
    maybe(options?.select).object();
    maybe(options?.sort).object();

    const result = await this.db.read(this.#as, {
      criteria,
      fields: Object.keys(options?.select ?? {}),
      sort: options?.sort,
    });

    return result as Filter<Document<S>, F>[];
  };

  /**
   * *Create a custom query.*
   *
   * @returns a buildable query
  */
  query(): Query<S> {
    return new Query(this.#schema);
  }
};
