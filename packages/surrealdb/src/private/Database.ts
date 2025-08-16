import typemap from "#typemap";
import Database from "@primate/core/Database";
import type As from "@primate/core/database/As";
import type DataDict from "@primate/core/database/DataDict";
import type TypeMap from "@primate/core/database/TypeMap";
import is from "@rcompat/assert/is";
import maybe from "@rcompat/assert/maybe";
import entries from "@rcompat/record/entries";
import type Dict from "@rcompat/type/Dict";
import type StoreSchema from "pema/StoreSchema";
import type Surreal from "surrealdb";
import type { QueryParameters } from "surrealdb";

function null_to_undefined(changes: Dict) {
  return entries(changes)
    .valmap(([, value]) => value === null ? undefined : value)
    .get();
}

function make_limit(limit?: number) {
  maybe(limit).usize();

  if (limit === undefined) {
    return "";
  }
  return `LIMIT ${limit}`;
};

function make_sort(sort: Dict<"asc" | "desc">) {
  is(sort).object();

  const sorting = Object.entries(sort)
    .map(([field, direction]) => `${field} ${direction}`);

  return sorting.length === 0 ? "" : `ORDER BY ${sorting.join(", ")}`;
};

const change = (changes: Dict) => {
  const keys = Object.keys(changes);

  const set = keys.map(field => `${field}=$s_${field}`).join(", ");
  return {
    binds: entries(changes).keymap(([key]) => `s_${key}`).get(),
    set: `SET ${set}`,
  };
};

function make_where(binds: Dict) {
  const keys = Object.keys(binds);

  if (keys.length === 0) {
    return "";
  }

  return `WHERE ${keys.map(key =>
    `${key}=${key === "id" ? "<record>" : ""}$${key}`,
  ).join(" AND ")}`;
};

export default class SurrealDBDatabase extends Database {
  #client: Surreal;

  constructor(client: Surreal) {
    super();

    this.#client = client;
  }

  #query<T extends unknown[]>(...args: QueryParameters) {
    return this.#client.query_raw<T>(...args);
  }

  get typemap() {
    return typemap as unknown as TypeMap<Dict>;
  }

  async close() {
    await this.#client.close();
  }

  async #new(name: string, schema: StoreSchema) {
    const body = Object.entries(schema)
      .map(([key, value]) => [key, this.column(value.datatype)])
      // id column implicitly created
      .filter(([key]) => key !== "id")
      .map(([key, value]) =>
        `DEFINE FIELD ${key} ON ${name} TYPE option<${value}>;`)
      .join("\n");
    const query = `
      DEFINE TABLE ${name} SCHEMALESS;
      ${body}
    `;
    await this.#query(query);
  }

  async #drop(name: string) {
    await this.#query(`REMOVE TABLE ${name}`);
  }

  get schema() {
    return {
      // noop
      create: this.#new.bind(this),
      delete: this.#drop.bind(this),
    };
  }

  async create<O extends Dict>(as: As, args: { record: DataDict }) {
    const columns = Object.keys(args.record);
    const values = columns.map(column => `$${column}`).join(",");
    const payload = columns.length > 0
      ? `(${columns.join(",")}) VALUES (${values})`
      : "{}";
    const query = `INSERT INTO ${as.name} ${payload}`;
    const binds = await this.bind(args.record, as.types);

    const [{ result }] = await this.#query<[{ id: string }][]>(query, binds);

    const [created] = result as { id: string }[];
    const { id } = created;
    return this.unbind({ ...args.record, id }, as.types) as O;
  }

  read(as: As, args: {
    count: true;
    criteria: DataDict;
  }): Promise<number>;
  read(as: As, args: {
    criteria: DataDict;
    fields?: string[];
    limit?: number;
    sort?: Dict<"asc" | "desc">;
  }): Promise<Dict[]>;
  async read(as: As, args: {
    count?: true;
    criteria: DataDict;
    fields?: string[];
    limit?: number;
    sort?: Dict<"asc" | "desc">;
  }) {
    const binds = await this.bind(args.criteria, as.types);
    const where = make_where(binds);

    if (args.count === true) {
      const query = `SELECT COUNT() FROM ${as.name} ${where}`;

      const [{ result }] = await this.#query<unknown[][]>(query, binds);

      return result.length;
    }

    const fields = args.fields ?? ["*"];
    const sort = make_sort(args.sort ?? {});
    const select = fields.length === 0 ? "*" : fields.join(", ");
    const limit = make_limit(args.limit);

    const subselect = (fields.length === 0
      ? ["*"]
      : [...new Set(fields.concat(Object.keys(args.sort ?? {})))]).join(", ");

    const query = `SELECT ${select} FROM
      (SELECT ${subselect} FROM ${as.name} ${where} ${sort} ${limit})`;
    const [{ result }] = await this.#query<Dict[][]>(query, binds);

    const records = result as Dict[];
    return records.map(record => this.unbind(record, as.types));
  }

  async update(as: As, args: {
    changes: DataDict;
    criteria: DataDict;
    limit?: number;
    sort?: Dict<"asc" | "desc">;
  }) {
    const criteria_binds = await this.bind(args.criteria, as.types);
    const changes = await this.bind(args.changes, as.types);
    const { binds: changes_binds, set } = change(null_to_undefined(changes));
    const where = make_where(criteria_binds);
    const binds = { ...criteria_binds, ...changes_binds };

    const query = `UPDATE ${as.name} ${set} ${where}`;

    const [{ result }] = await this.#query<unknown[][]>(query, binds);

    return result.length;
  }

  async delete(as: As, args: { criteria: DataDict }) {
    const binds = await this.bind(args.criteria, as.types);
    const where = make_where(binds);

    const query = `DELETE FROM ${as.name} ${where} RETURN diff`;

    const [{ result }] = await this.#query<unknown[][]>(query, binds);

    return result.length;
  }
}
