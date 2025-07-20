import typemap from "#typemap";
import type As from "@primate/core/db/As";
import type Database from "@primate/core/db/Database";
import type Types from "@primate/core/db/Types";
import is from "@rcompat/assert/is";
import maybe from "@rcompat/assert/maybe";
import entries from "@rcompat/record/entries";
import type Client from "@rcompat/sqlite";
import type PrimitiveParam from "@rcompat/sqlite/PrimitiveParam";
import type Dict from "@rcompat/type/Dict";
import type StoreSchema from "pema/StoreSchema";

type Bindings = Dict<PrimitiveParam>;

function make_sort(sort: Dict<"asc" | "desc">)  {
  is(sort).object();

  const sorting = Object.entries(sort)
    .map(([field, direction]) => `${field} ${direction}`);

  return sorting.length === 0 ? "" : `ORDER BY ${sorting.join(",")}`;
};

function make_limit(limit?: number) {
  maybe(limit).usize();

  if (limit === undefined) {
    return "";
  }
  return `LIMIT ${limit}`;
};

function make_where(bindings: Bindings)  {
  const keys = Object.keys(bindings);

  if (keys.length === 0) {
    return "";
  }
  return `WHERE ${keys.map(key => `"${key}"=$${key}`).join(" AND ")}`;
};

const change = (changes: Bindings) => {
  const keys = Object.keys(changes);
  const set = keys.map(field => `"${field}"=$s_${field}`).join(",");
  return {
    set: `SET ${set}`,
    bindings: entries(changes).keymap(([key]) => `s_${key}`).get(),
  };
};


export default class SqliteDatabase implements Database {
  #client: Client;

  constructor(client: Client) {
    this.#client = client;
  }

  #new(name: string, schema: StoreSchema) {
    const body = Object.entries(schema)
      .map(([key, value]) => `"${key}" ${typemap(value.datatype).type}`)
      .join(",");
    const query = `CREATE TABLE IF NOT EXISTS ${name} (${body})`;
    this.#client.prepare(query).run();
  }

  #drop(name: string) {
    const query = `DROP TABLE IF EXISTS ${name}`;
    this.#client.prepare(query).run();
  }

  get schema() {
    return {
      create: this.#new.bind(this),
      delete: this.#drop.bind(this),
    };
  }

  #unbind(record: Dict, types: Types): Dict {
    return Object.fromEntries(Object.entries(record).map(([key, value]) =>
      [key, typemap(types[key]).out(value)]));
  }

  async #bind(record: Dict, types: Types) {
    return Object.fromEntries(await Promise.all(Object.entries(record)
      .map(async ([key, value]) =>
        [key, await typemap(types[key]).in(value as never)])));
  }

  async create<O extends Dict>(as: As, args: { record: Dict }) {
    const keys = Object.keys(args.record);
    const columns = keys.map(key => `"${key}"`);
    const values = keys.map(key => `$${key}`).join(",");
    const $predicate = columns.length > 0
      ? `(${columns.join(",")}) VALUES (${values})`
      : "DEFAULT VALUES";
    const query = `INSERT INTO ${as.name} ${$predicate} RETURNING ID;`;
    const bindings = await this.#bind(args.record, as.types);
    const statement = this.#client.prepare(query);
    const changes = statement.run(bindings);
    const id = changes.lastInsertRowid;

    return this.#unbind({ ...args.record, id }, as.types) as O;
  }

  #count(as: As, bindings: Bindings) {
    const where = make_where(bindings);
    const query = `SELECT COUNT(*) AS n FROM ${as.name} ${where};`;
    const statement = this.#client.prepare(query);
    const [{ n }] = statement.all(bindings);
    return Number(n);
  }

  read(as: As, args: {
    criteria: Dict;
    count: true;
  }): Promise<number>;
  read(as: As, args: {
    criteria: Dict;
    fields?: string[];
    sort?: Dict<"asc" | "desc">;
    limit?: number;
  }): Promise<Dict[]>;
  async read(as: As, args: {
    criteria: Dict;
    fields?: string[];
    count?: true;
    sort?: Dict<"asc" | "desc">;
    limit?: number;
  }) {
    const bindings = await this.#bind(args.criteria, as.types);

    if (args.count === true) {
      return this.#count(as, bindings);
    }

    const fields = args.fields ?? [];
    const sort = make_sort(args.sort ?? {});
    const limit = make_limit(args.limit);
    const where = make_where(bindings);
    const select = fields.length === 0 ? "*" : fields.join(", ");
    const query = `SELECT ${select} FROM ${as.name} ${where} ${sort} ${limit};`;
    const records = this.#client.prepare(query).all(bindings);

    return records.map(record =>
      this.#unbind(entries(record).filter(([, value]) => value !== null).get(),
        as.types));
  }

  update(as: As, args: {
    criteria: Dict;
    changes: Dict;
    count: true;
  }): Promise<number>;
  update(as: As, args: {
    criteria: Dict;
    changes: Dict;
    sort?: Dict<"asc" | "desc">;
    limit?: number;
  }): Promise<Dict[]>;
  async update(as: As, args: {
    criteria: Dict;
    changes: Dict;
    count?: true;
    sort?: Dict<"asc" | "desc">;
    limit?: number;
  }) {
    const criteria_bindings = await this.#bind(args.criteria, as.types);
    const changes = await this.#bind(args.changes, as.types);
    const where = make_where(criteria_bindings);
    const { set, bindings: set_bindings } = change(changes);
    const bindings = { ...criteria_bindings, ...set_bindings };
    const sort = make_sort(args.sort ?? {});

    const query = `
      WITH to_update AS (
        SELECT id FROM ${as.name}
        ${where}
        ${sort}
      )
      UPDATE ${as.name} 
      ${set}
      WHERE id IN (SELECT id FROM to_update)
    `;
    if (args.count === true) {
      return this.#client.prepare(`${query};`).run(bindings).changes;
    }

    const updated = this.#client.prepare(`${query} RETURNING *;`).all(bindings);
    return updated.map(record =>
      this.#unbind(entries(record).filter(([, value]) => value !== null).get(),
        as.types));
  }

  async delete(as: As, args: { criteria: Dict }) {
    const bindings = await this.#bind(args.criteria, as.types);
    const where = make_where(bindings);
    const query = `DELETE FROM ${as.name} ${where}`;

    return Number(this.#client.prepare(query).run(bindings).changes);
  };
}
