import typemap from "#typemap";
import type { As, DataDict, TypeMap } from "@primate/core/database";
import Database from "@primate/core/database/Database";
import assert from "@rcompat/assert";
import type { Dict } from "@rcompat/type";
import type {
  Connection, Pool, ResultSetHeader as Result, RowDataPacket as RowData,
} from "mysql2/promise";
import mysql from "mysql2/promise";
import p, { type StoreSchema } from "pema";

type Binds = Parameters<Connection["query"]>[1];

const schema = p({
  database: p.string,
  host: p.string.default("localhost"),
  password: p.string.optional(),
  port: p.uint.port().default(3306),
  username: p.string.optional(),
});

export default class MySQLDatabase extends Database {
  #factory: () => Pool;
  #client?: Pool;

  static config: typeof schema.input;

  constructor(config?: typeof schema.input) {
    super(":");
    const parsed = schema.parse(config);

    this.#factory = () => mysql.createPool({
      host: parsed.host,
      port: parsed.port,
      database: parsed.database,
      user: parsed.username,
      password: parsed.password,
      connectionLimit: 10,
      queueLimit: 0,
      keepAliveInitialDelay: 0,
      enableKeepAlive: true,
      waitForConnections: true,
      namedPlaceholders: true,
      bigNumberStrings: true,
      supportBigNumbers: true,
    });
  }

  get typemap() {
    return typemap as unknown as TypeMap<Dict>;
  }

  #get() {
    if (this.#client === undefined) {
      this.#client = this.#factory();
    }
    return this.#client;
  }

  formatBinds(binds: Dict): Dict {
    return Object.fromEntries(
      Object.entries(binds).map(([k, v]) => [k.replace(/^[:$]/, ""), v]),
    );
  }

  async close() {
    await this.#get().end();
  }

  async #with<T>(executor: (connection: Connection) => Promise<unknown>) {
    const connection = await this.#get().getConnection();
    try {
      return await executor(connection) as T;
    } finally {
      connection.release();
    }
  }

  async #new(name: string, store: StoreSchema) {
    const body = Object.entries(store)
      .map(([key, value]) =>
        `${this.ident(key)} ${this.column(value.datatype)}`)
      .join(",");
    const query = `CREATE TABLE IF NOT EXISTS ${this.ident(name)} (${body})`;

    await this.#with(async connection => {
      await connection.query(query);
    });
  }

  async #drop(name: string) {
    const query = `DROP TABLE IF EXISTS ${this.ident(name)}`;
    await this.#with(async connection => {
      await connection.query(query);
    });
  }

  get schema() {
    return {
      create: this.#new.bind(this),
      delete: this.#drop.bind(this),
    };
  }

  async create<O extends Dict>(as: As, args: { record: DataDict }) {
    assert.dict(args.record, "empty record");

    const keys = Object.keys(args.record);
    const columns = keys.map(k => this.ident(k));
    const values = keys.map(key => `:${key}`).join(",");
    const payload = `(${columns.join(",")}) VALUES (${values})`;
    const query = `INSERT INTO ${this.table(as)} ${payload};`;
    const binds = await this.bind(as.types, args.record) as Binds;

    return this.#with(async connection => {
      const [{ insertId }] = await connection.query<Result>(query, binds);
      return this.unbind(as.types, { ...args.record, id: insertId }) as O;
    }) as Promise<O>;
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

    const where = this.toWhere(as.types, args.criteria);
    const binds = await this.bindCriteria(as.types, args.criteria) as Binds;

    if (args.count ?? false) {
      return this.#with(async connection => {
        const query = `SELECT COUNT(*) AS n FROM ${this.table(as)} ${where}`;
        const [[{ n }]] = await connection.query<RowData[]>(query, binds);
        return Number(n);
      });
    }

    const select = this.toSelect(as.types, args.fields);
    const sort = this.toSort(as.types, args.sort);
    const limit = this.toLimit(args.limit);
    const query = `SELECT ${select}
      FROM ${this.table(as)} ${where}${sort}${limit};`;

    return this.#with(async connection => {
      const [records] = await connection.query<RowData[]>(query, binds);
      return records.map(record => this.unbind(as.types, record));
    });
  }

  async update(as: As, args: { changeset: DataDict; criteria: DataDict }) {
    assert.nonempty(args.changeset, "empty changeset");
    assert.nonempty(args.criteria, "empty criteria");

    const where = this.toWhere(as.types, args.criteria);
    const criteria_binds = await this.bindCriteria(as.types, args.criteria);
    const {
      set, binds: changeset_binds,
    } = await this.toSet(as.types, args.changeset);
    const binds = { ...criteria_binds, ...changeset_binds } as Binds;
    const query = `
      UPDATE ${this.table(as)}
      ${set}
      WHERE id IN (
        SELECT id FROM (
          SELECT id FROM ${this.table(as)}
          ${where}
        ) AS to_update
      );
    `;

    return this.#with<number>(async connection => {
      const [{ affectedRows }] = await connection.query<Result>(query, binds);
      return affectedRows;
    });
  }

  async delete(as: As, args: { criteria: DataDict }) {
    assert.nonempty(args.criteria, "empty criteria");

    const where = this.toWhere(as.types, args.criteria);
    const binds = await this.bindCriteria(as.types, args.criteria) as Binds;
    const query = `DELETE FROM ${this.table(as)} ${where}`;

    return this.#with<number>(async connection => {
      const [{ affectedRows }] = await connection.query<Result>(query, binds);
      return affectedRows;
    });
  };
}
