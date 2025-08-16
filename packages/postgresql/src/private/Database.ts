import typemap from "#typemap";
import Database from "@primate/core/Database";
import type As from "@primate/core/database/As";
import type DataDict from "@primate/core/database/DataDict";
import type TypeMap from "@primate/core/database/TypeMap";
import is from "@rcompat/assert/is";
import maybe from "@rcompat/assert/maybe";
import type Dict from "@rcompat/type/Dict";
import type StoreSchema from "pema/StoreSchema";
import type { Sql } from "postgres";

function make_sort(sort: Dict<"asc" | "desc">) {
  is(sort).object();

  const sorting = Object.entries(sort)
    .map(([field, direction]) => `${field} ${direction}`);

  return sorting.length === 0 ? "" : ` ORDER BY ${sorting.join(",")}`;
};

function make_limit(limit?: number) {
  maybe(limit).usize();

  if (limit === undefined) {
    return "";
  }
  return ` LIMIT ${limit}`;
};

export default class PostgreSQLDatabase extends Database {
  #client: Sql;

  constructor(client: Sql) {
    super();

    this.#client = client;
  }

  get typemap() {
    return typemap as unknown as TypeMap<Dict>;
  }

  async close() {
    await this.#client.end();
  }

  async #new(name: string, schema: StoreSchema) {
    const body = Object.entries(schema)
      .map(([key, value]) => `"${key}" ${this.column(value.datatype)}`)
      .join(",");
    const client = this.#client;
    await client`CREATE TABLE IF NOT EXISTS
      ${client(name)} (${client.unsafe(body)})
    `;
  }

  async #drop(name: string) {
    const client = this.#client;
    await client`DROP TABLE IF EXISTS ${client(name)};`;
  }

  get schema() {
    return {
      create: this.#new.bind(this),
      delete: this.#drop.bind(this),
    };
  }

  async create<O extends Dict>(as: As, args: { record: DataDict }) {
    const client = this.#client;

    const columns = Object.keys(args.record);
    const binds = await this.bind(args.record, as.types);
    const [result] = await client`INSERT INTO
      ${client(as.name)}
      ${columns.length > 0
        ? client`(${client(columns)}) VALUES ${client(binds)}`
        : client.unsafe("DEFAULT VALUES")}
      RETURNING id;
    `;
    return this.unbind({ ...args.record, id: result.id }, as.types) as O;
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
    const client = this.#client;

    if (args.count === true) {
      const [{ n }] = await client`
        SELECT COUNT(*) AS n
        FROM ${client(as.name)}
        WHERE ${Object.entries(binds).reduce((acc, [key, value]) =>
        (client as any)`${acc} AND ${client(key)} = ${value}`, client`TRUE`)}
      `;
      return Number(n);
    }

    const fields = args.fields ?? [];
    const sort = make_sort(args.sort ?? {});
    const limit = make_limit(args.limit);
    const select = fields.length === 0 ? "*" : fields.join(", ");

    const records = (await client`
      SELECT ${client.unsafe(select)}
      FROM ${client(as.name)}
      WHERE ${Object.entries(binds).reduce((acc, [key, value]) =>
      (client as any)`${acc} AND ${client(key)} = ${value}`, client`TRUE`)}
      ${client.unsafe(sort)}
      ${client.unsafe(limit)}
  `);

    return records.map(record => this.unbind(record, as.types));
  }

  async update(as: As, args: {
    changes: DataDict;
    criteria: DataDict;
    limit?: number;
    sort?: Dict<"asc" | "desc">;
  }) {
    const client = this.#client;

    const criteria_binds = await this.bind(args.criteria, as.types);
    const changes_binds = await this.bind(args.changes, as.types);

    return (await client`
      UPDATE ${client(as.name)}
      SET ${client({ ...changes_binds })}
      WHERE ${Object.entries(criteria_binds).reduce((acc, [key, value]) =>
      (client as any)`${acc} AND ${client(key)} = ${value}`, client`TRUE`)}
      RETURNING 1;
    `).length;
  }

  async delete(as: As, args: { criteria: DataDict }) {
    const client = this.#client;

    const binds = await this.bind(args.criteria, as.types);

    return (await client`
      DELETE FROM ${client(as.name)}
      WHERE ${Object.entries(binds).reduce((acc, [key, value]) =>
      (client as any)`${acc} AND ${client(key)} = ${value}`, client`TRUE`)}
      RETURNING 1;
    `).length;
  };
}
