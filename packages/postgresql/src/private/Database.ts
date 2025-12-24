import typemap from "#typemap";
import type { As, DataDict, TypeMap } from "@primate/core/database";
import Database from "@primate/core/database/Database";
import assert from "@rcompat/assert";
import type { Dict } from "@rcompat/type";
import p, { type StoreSchema } from "pema";
import postgres, { type Sql } from "postgres";

type Types = As["types"];

const schema = p({
  database: p.string,
  host: p.string.default("localhost"),
  password: p.string.optional(),
  port: p.uint.port().default(5432),
  username: p.string.optional(),
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
    assert.dict(args.record, "empty record");

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
    assert.maybe.dict(sort);
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
    assert.maybe.uint(limit);

    const sql = this.#sql();

    return limit === undefined ? sql`` : sql` LIMIT ${limit}`;
  }

  #where(types: Types, criteria: DataDict, nonnull: Dict) {
    this.toWhere(types, criteria); // validate

    const sql = this.#sql();
    const entries = Object.entries(criteria);
    if (entries.length === 0) return sql``;

    const clauses = entries.map(([key, raw]) => {
      if (raw === null) return sql`${sql(key)} IS NULL`;

      const value = nonnull[key];

      // handle operator objects
      if (typeof raw === "object") {
        if ("$like" in raw) return sql`${sql(key)} LIKE ${value}`;
        // if ("$gte" in raw) return sql`${sql(key)} >= ${nonnull[key]}`;
      }

      return sql`${sql(key)} = ${value}`;
    });

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
    assert.dict(args.criteria);
    assert.maybe.true(args.count);

    const sql = this.#sql();
    const table = sql(as.name);
    const criteria_binds = await this.bindCriteria(as.types, args.criteria);
    const where = this.#where(as.types, args.criteria, criteria_binds);

    if (args.count ?? false) {
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

  async update(as: As, args: { changeset: DataDict; criteria: DataDict }) {
    assert.nonempty(args.changeset, "empty changeset");
    assert.nonempty(args.criteria, "empty criteria");

    const sql = this.#sql();
    const table = sql(as.name);
    const criteria_binds = await this.bindCriteria(as.types, args.criteria);
    const changeset_bind = await this.bind(as.types, args.changeset);
    const where = this.#where(as.types, args.criteria, criteria_binds);
    const set = sql({ ...changeset_bind });

    return (await sql`UPDATE ${table} SET ${set} ${where} RETURNING 1;`).length;
  }

  async delete(as: As, args: { criteria: DataDict }) {
    assert.nonempty(args.criteria, "empty criteria");

    const sql = this.#sql();
    const criteria_binds = await this.bindCriteria(as.types, args.criteria);
    const where = this.#where(as.types, args.criteria, criteria_binds);
    const table = sql(as.name);

    return (await sql`DELETE FROM ${table} ${where} RETURNING 1;`).length;
  };
}
