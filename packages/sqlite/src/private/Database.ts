import typemap from "#typemap";
import type Database from "@primate/core/db/Database";
import type Store from "@primate/core/db/Store";
import maybe from "@rcompat/assert/maybe";
import entries from "@rcompat/record/entries";
import type Client from "@rcompat/sqlite";
import type EO from "@rcompat/type/EO";
import type DataType from "pema/DataType";
import type StoreSchema from "pema/StoreSchema";
import type InferStore from "pema/InferStore";

type CreateOptions = {
  limit?: number;
};
type Criteria = EO;
type Projection = EO[];
type ReadOptions = {
  sort?: "asc" | "desc";
  count?: boolean;
  limit?: number;
};

const make_sort = ({ sort = {} } = {}) => {
  maybe(sort).object();

  const _entries = Object.entries(sort)
    .map(([field, direction]) => `${field} ${direction}`);

  return _entries.length === 0 ? "" : `order by ${_entries.join(",")}`;
};

const predicate = (criteria: EO) => {
  const keys = Object.keys(criteria);
  if (keys.length === 0) {
    return { where: "", bindings: {} };
  }

  const where = `where ${keys.map(key => `"${key}"=$${key}`).join(" and ")}`;

  return { where, bindings: criteria };
};
type Description = Record<string, keyof DataType>;

export default class Sqlite<S extends StoreSchema> implements Database<S> {
  #client: Client;

  constructor(client: Client) {
    this.#client = client;
  }

  #new(name: string, description: Description) {
    const body = Object.entries(description)
      .map(entry => {
        const [column, value] = entry;
        return `"${column}" ${typemap(value)}`;
      }).join(",");
    const query = `create table if not exists ${name} (${body})`;
    this.#client.prepare(query).run();
  }

  #drop(name: string) {
    const query = `drop table if exists ${name}`;
    this.#client.prepare(query).run();
  }

  get schema() {
    return {
      create: this.#new.bind(this),
      delete: this.#drop.bind(this),
    };
  }

  async create(store: Store<S>, document: InferStore<S>,
    _options?: CreateOptions): Promise<InferStore<S>> {
    const keys = Object.keys(document);
    const columns = keys.map(key => `"${key}"`);
    const values = keys.map(key => `$${key}`).join(",");
    const $predicate = columns.length > 0
      ? `(${columns.join(",")}) values (${values})`
      : "default values";
    const query = `insert into ${store.name} ${$predicate} returning id`;
    const statement = this.#client.prepare(query);
    const changes = statement.run();
    return { ...document, id: changes.lastInsertRowid };
  }

  async read(store: Store<S>,
    criteria: Criteria,
    projection: Projection = [],
    options?: ReadOptions) {

    const sorting = make_sort(options ?? {});
    const { where, bindings } = predicate(criteria);
    const select = projection.length === 0 ? "*" : projection.join(", ");
    const query = `select ${select} from ${store.name} ${where} ${sorting};`;
    const statement = this.#client.prepare(query);
    const results: Record<string, unknown>[] = statement.all(bindings);
    return results.map(result =>
      entries(result).filter(([, value]) => value !== null).get());
  }

  async update(_store: Store<S>, _criteria: Criteria, _set: Document) {
    return 0;
  }

  async delete(_store: Store<S>, _criteria: Criteria) {

  }
}
