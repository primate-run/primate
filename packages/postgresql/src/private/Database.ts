import typemap from "#typemap";
import Database from "@primate/core/Database";
import type As from "@primate/core/database/As";
import type DataDict from "@primate/core/database/DataDict";
import type TypeMap from "@primate/core/database/TypeMap";
import type Types from "@primate/core/database/Types";
import assert from "@rcompat/assert";
import maybe from "@rcompat/assert/maybe";
import type Dict from "@rcompat/type/Dict";
import pema from "pema";
import type StoreSchema from "pema/StoreSchema";
import string from "pema/string";
import uint from "pema/uint";
import postgres, { type Sql } from "postgres";

const schema = pema({
  database: string,
  host: string.default("localhost"),
  password: string.optional(),
  port: uint.port().default(5432),
  username: string.optional(),
});

export default class PostgreSQLDatabase extends Database {
  static config: typeof schema.input;
  #factory: () => Sql;
  #client?: Sql;

  constructor(config?: typeof schema.input) {
    super();
    const parsed = schema.parse(config);
    this.#factory = () => postgres({
      db: parsed.database,
      host: parsed.host,
      pass: parsed.password,
      port: parsed.port,
      user: parsed.username,
    });
  }

  #sql() {
    if (this.#client === undefined) {
      this.#client = this.#factory();
    }
    return this.#client as any;
  }

  #join(parts: ReturnType<Sql>[], sep: ReturnType<Sql>): ReturnType<Sql> {
    const sql = this.#sql();
    if (parts.length === 0) return sql``;
    return parts.slice(1).reduce((acc, p) => sql`${acc}${sep}${p}`, parts[0]);
  }

  async #new(name: string, store: StoreSchema) {
    const sql = this.#sql();
    const table = sql(name);
    const body = Object.entries(store).map(
      ([k, v]) => sql`${sql(k)} ${sql.unsafe(this.column(v.datatype))}`,
    );
    await sql`CREATE TABLE IF NOT EXISTS ${table}
      (${this.#join(body, sql`, `)})`;
  }

  async #drop(name: string) {
    const sql = this.#sql();
    await sql`DROP TABLE IF EXISTS ${sql(name)};`;
  }

  get typemap() {
    return typemap as unknown as TypeMap<Dict>;
  }

  async close() {
    await this.#sql().end();
  }

  get schema() {
    return {
      create: this.#new.bind(this),
      delete: this.#drop.bind(this),
    };
  }

  async create<O extends Dict>(as: As, args: { record: DataDict }) {
    const sql = this.#sql();
    const columns = Object.keys(args.record);
    const binds = await this.bind(as.types, args.record);
    const [result] = await sql`INSERT INTO
      ${sql(as.name)}
      ${columns.length > 0
        ? sql`(${sql(columns)}) VALUES ${sql(binds)}`
        : sql.unsafe("DEFAULT VALUES")}
      RETURNING id;
    `;

    return this.unbind(as.types, { ...args.record, id: result.id }) as O;
  }

  #sort(types: Types, sort?: Dict<"asc" | "desc">) {
    maybe(sort).object();
    // validate
    this.toSort(types, sort);

    const sql = this.#sql();
    if (!sort) return sql``;

    const entries = Object.entries(sort);
    if (entries.length === 0) return sql``;

    const items = entries.map(([field, direction]) =>
      sql`${sql(field)} ${sql.unsafe(direction.toUpperCase())}`,
    );

    return sql` ORDER BY ${this.#join(items, sql`, `)}`;
  }

  #select(types: Types, fields?: string[]) {
    // validate
    this.toSelect(types, fields);

    const sql = this.#sql();

    if (fields === undefined) return sql.unsafe("*");

    return sql(fields);
  }

  #limit(limit?: number) {
    maybe(limit).usize();

    const sql = this.#sql();

    return limit === undefined ? sql`` : sql` LIMIT ${limit}`;
  }

  #where(types: Types, criteria: Dict, nonnull: Dict) {
    this.toWhere(types, criteria); // validate

    const sql = this.#sql();
    const entries = Object.entries(criteria);
    if (entries.length === 0) return sql``;

    const clauses = entries.map(([key, raw]) => raw === null
      ? sql`${sql(key)} IS NULL`
      : sql`${sql(key)} = ${nonnull[key]}`,
    );

    return sql`WHERE ${this.#join(clauses, sql` AND `)}`;
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
    const sql = this.#sql();
    const table = sql(as.name);
    const criteria = await this.bindCriteria(as.types, args.criteria);
    const where = this.#where(as.types, args.criteria, criteria);

    if (args.count === true) {
      const [{ n }] = await sql`SELECT COUNT(*) AS n FROM ${table} ${where}`;
      return Number(n);
    }

    const sort = this.#sort(as.types, args.sort);
    const limit = this.#limit(args.limit);
    const select = this.#select(as.types, args.fields);

    const records = await sql`
      SELECT ${select}
      FROM ${table}
      ${where}
      ${sort}
      ${limit}
    ` as DataDict[];

    return records.map(record => this.unbind(as.types, record));
  }

  async update(as: As, args: { changes: DataDict; criteria: DataDict }) {
    assert(Object.keys(args.criteria).length > 0, "update: no criteria");

    const sql = this.#sql();
    const table = sql(as.name);
    const criteria = await this.bindCriteria(as.types, args.criteria);
    const set_binds = await this.bind(as.types, args.changes);
    const where = this.#where(as.types, args.criteria, criteria);
    const set = sql({ ...set_binds });

    return (await sql`UPDATE ${table} SET ${set} ${where} RETURNING 1;`).length;
  }

  async delete(as: As, args: { criteria: DataDict }) {
    assert(Object.keys(args.criteria).length > 0, "delete: no criteria");

    const sql = this.#sql();
    const criteria = await this.bindCriteria(as.types, args.criteria);
    const where = this.#where(as.types, args.criteria, criteria);
    const table = sql(as.name);

    return (await sql`DELETE FROM ${table} ${where} RETURNING 1;`).length;
  };
}
