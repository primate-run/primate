import typemap from "#typemap";
import type As from "@primate/core/db/As";
import type Database from "@primate/core/db/Database";
import type Types from "@primate/core/db/Types";
import maybe from "@rcompat/assert/maybe";
import entries from "@rcompat/record/entries";
import type Client from "@rcompat/sqlite";
import type Param from "@rcompat/sqlite/Param";
import type Dict from "@rcompat/type/Dict";
import type MaybePromise from "@rcompat/type/MaybePromise";
import type StoreSchema from "pema/StoreSchema";

const make_sort = ({ sort = {} } = {}) => {
  maybe(sort).object();

  const _entries = Object.entries(sort)
    .map(([field, direction]) => `${field} ${direction}`);

  return _entries.length === 0 ? "" : `order by ${_entries.join(",")}`;
};

const predicate = (criteria: Dict) => {
  const keys = Object.keys(criteria);
  if (keys.length === 0) {
    return { where: "", bindings: {} };
  }

  const where = `where ${keys.map(key => `"${key}"=$${key}`).join(" and ")}`;

  return { where, bindings: criteria };
};

export default class Sqlite implements Database {
  #client: Client;

  constructor(client: Client) {
    this.#client = client;
  }

  #new(name: string, schema: StoreSchema) {
    const body = Object.entries(schema)
      .map(([key, value]) => `"${key}" ${typemap(value.datatype).type}`)
      .join(",");
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

  #unwrap(document: Dict, types: Types) {
    return Object.fromEntries(Object.entries(document).map(([key, value]) =>
      [key, typemap(types[key]).out(value)]));
  }

  async #wrap(document: Dict, types: Types): Promise<Param> {
    return Object.fromEntries(Object.entries(document).map(([key, value]) =>
      [key, typemap(types[key]).in(value as never)])) as Param;
  }

  async create<O extends Dict>(as: As, args: {
    document: Dict;
  }) {
    const keys = Object.keys(args.document);
    const columns = keys.map(key => `"${key}"`);
    const values = keys.map(key => `$${key}`).join(",");
    const $predicate = columns.length > 0
      ? `(${columns.join(",")}) values (${values})`
      : "default values";
    const query = `insert into ${as.name} ${$predicate} returning id`;
    const statement = this.#client.prepare(query);
    const changes = statement.run(await this.#wrap(args.document, as.types));
    const id = changes.lastInsertRowid;

    return this.#unwrap({ ...args.document, id }, as.types) as O;
  }

  #count(as: As, criteria: Dict) {
    const { where, bindings } = predicate(criteria);
    const query = `select count(*) as n from ${as.name} ${where};`;
    const statement = this.#client.prepare(query);
    const [{ n }] = statement.all(bindings as Dict<any>);
    return Number(n);
  }

  read(as: As, args: {
    criteria: Dict;
    count: true;
  }): MaybePromise<number>;
  read(as: As, args: {
    criteria: Dict;
    fields?: string[];
    sort?: Dict<"asc" | "desc">;
    limit?: number;
  }): MaybePromise<Dict[]>;
  read(as: As, args: {
    criteria: Dict;
    fields?: string[];
    count?: true;
    sort?: Dict<"asc" | "desc">;
    limit?: number;
  }): MaybePromise<number | Dict[]> {
    if (args.count === true) {
      return this.#count(as, args.criteria);
    }
    const fields = args.fields ?? [];

    const sorting = make_sort(args.sort ?? {});
    const { where, bindings } = predicate(args.criteria);
    const select = fields.length === 0 ? "*" : fields.join(", ");
    const query = `select ${select} from ${as.name} ${where} ${sorting};`;
    const statement = this.#client.prepare(query);
    const results = statement.all(bindings as Dict<any>);
    return results.map(result => this.#unwrap(
      entries(result).filter(([, value]) => value !== null)
        .get(), as.types));
  }

  update(as: As, args: {
    criteria: Dict;
    delta: Dict;
    count?: true;
  }): MaybePromise<number>;
  update(as: As, args: {
    criteria: Dict;
    delta: Dict;
    sort?: Dict<"asc" | "desc">;
    limit?: number;
  }): MaybePromise<Dict[]>;
  update(as: As, args: {
    criteria: Dict;
    delta: Dict;
    count?: true;
    sort?: Dict<"asc" | "desc">;
    limit?: number;
  }): MaybePromise<number | Dict[]> {
    return 0;
  }

  delete(_as: As, _args: {
    criteria: Dict;
  }){

  };
}
