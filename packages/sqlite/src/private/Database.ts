import typemap from "#typemap";
import type As from "@primate/core/db/As";
import Database from "@primate/core/db/Database";
import type DataDict from "@primate/core/db/DataDict";
import type TypeMap from "@primate/core/db/TypeMap";
import is from "@rcompat/assert/is";
import maybe from "@rcompat/assert/maybe";
import entries from "@rcompat/record/entries";
import type Client from "@rcompat/sqlite";
import type Dict from "@rcompat/type/Dict";
import type StoreSchema from "pema/StoreSchema";

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

function make_where(binds: Dict) {
  const keys = Object.keys(binds).map(key => key.slice(1));

  if (keys.length === 0) {
    return "";
  }
  return `WHERE ${keys.map(key => `${key}=$${key}`).join(" AND ")}`;
};

const change = (changes: Dict) => {
  const keys = Object.keys(changes).map(key => key.slice(1));

  const set = keys.map(field => `${field}=$s_${field}`).join(",");
  return {
    binds: entries(changes).keymap(([key]) => `$s_${key.slice(1)}`).get(),
    set: `SET ${set}`,
  };
};

export default class SqliteDatabase extends Database {
  #client: Client;

  constructor(client: Client) {
    super("$");

    this.#client = client;
  }

  get typemap() {
    return typemap as unknown as TypeMap<Dict>;
  }

  #new(name: string, schema: StoreSchema) {
    const body = Object.entries(schema)
      .map(([key, value]) => `\`${key}\` ${this.column(value.datatype)}`)
      .join(",");
    const query = `CREATE TABLE IF NOT EXISTS \`${name}\` (${body})`;
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

  async create<O extends Dict>(as: As, args: { record: DataDict }) {
    const keys = Object.keys(args.record);
    const columns = keys.map(key => `"${key}"`);
    const values = keys.map(key => `$${key}`).join(",");
    const payload = columns.length > 0
      ? `(${columns.join(",")}) VALUES (${values})`
      : "DEFAULT VALUES";
    const query = `INSERT INTO ${as.name} ${payload} RETURNING ID;`;
    const binds = await this.bind(args.record, as.types);
    const statement = this.#client.prepare(query);
    const changes = statement.run(binds);
    const id = BigInt(changes.lastInsertRowid);

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
      const query = `SELECT COUNT(*) AS n FROM ${as.name} ${where};`;
      const statement = this.#client.prepare(query);
      const [{ n }] = statement.all(binds);
      return Number(n);
    }

    const fields = args.fields ?? [];
    const sort = make_sort(args.sort ?? {});
    const limit = make_limit(args.limit);
    const select = fields.length === 0 ? "*" : fields.join(", ");
    const query = `SELECT ${select} FROM ${as.name} ${where}${sort}${limit};`;
    const records = this.#client.prepare(query).all(binds);

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
    const where = make_where(criteria_binds);
    const { binds: changes_binds, set } = change(changes);
    const binds = { ...criteria_binds, ...changes_binds };
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

    return Number(this.#client.prepare(`${query};`).run(binds).changes);
  }

  async delete(as: As, args: { criteria: DataDict }) {
    const binds = await this.bind(args.criteria, as.types);
    const where = make_where(binds);
    const query = `DELETE FROM ${as.name} ${where}`;

    return Number(this.#client.prepare(query).run(binds).changes);
  };
}
