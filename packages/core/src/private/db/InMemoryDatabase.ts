import type Database from "#db/Database";
import type Store from "#db/Store";
import type Dict from "@rcompat/type/Dict";
import type EO from "@rcompat/type/EO";
import type PartialDict from "@rcompat/type/PartialDict";
import type InferStore from "pema/InferStore";
import type StoreSchema from "pema/StoreSchema";

type Projection = EO[] | null;
type Criteria = EO;
type Document = EO;
type ReadOptions = {
  count?: boolean;
  limit?: number;
};
type CreateOptions = {
  limit?: number;
};

export default class InMemory<S extends StoreSchema> implements Database<S> {
  #collections: PartialDict<Dict> = {};

  #new(name: string) {
    if (this.#collections[name] !== undefined) {
      throw new Error(`collection ${name} already exists`);
    }
    this.#collections[name] = {};
  }

  #drop(name: string) {
    if (this.#collections[name] === undefined) {
      throw new Error(`collection ${name} doesn't exist`);
    }
    delete this.#collections[name];
  }

  get schema() {
    return {
      create: this.#new,
      delete: this.#drop,
    };
  }

  async create(
    _store: Store<S>,
    _document: InferStore<S>,
    _options?: CreateOptions,
  ): Promise<InferStore<S>> {
    return {} as InferStore<S>;
  }

  async read(
    _store: Store<S>,
    _criteria: Criteria,
    _projection?: Projection,
    _options?: ReadOptions,
  ): Promise<Document[]> {
    return [];
  }

  async update(
    _store: Store<S>,
    _criteria: Criteria,
    _set: Document,
  ) {
    return 1;
  }

  async delete(
    _store: Store<S>,
    _criteria: Criteria,
  ) {
  }
}
