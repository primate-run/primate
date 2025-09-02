import typemap from "#typemap";
import Database from "@primate/core/Database";
import type As from "@primate/core/database/As";
import type DataDict from "@primate/core/database/DataDict";
import type TypeMap from "@primate/core/database/TypeMap";
import assert from "@rcompat/assert";
import type Dict from "@rcompat/type/Dict";
import type {
  Connection, Pool, ResultSetHeader as Result, RowDataPacket as RowData,
} from "mysql2/promise";
import mysql from "mysql2/promise";
import pema from "pema";
import type StoreSchema from "pema/StoreSchema";
import string from "pema/string";
import uint from "pema/uint";

type Binds = Parameters<Connection["query"]>[1];

const schema = pema({
  database: string,
  host: string.default("localhost"),
  password: string.optional(),
  port: uint.port().default(3306),
  username: string.optional(),
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
    const where = this.toWhere(as.types, args.criteria);
    const binds = await this.bindCriteria(as.types, args.criteria) as Binds;

    if (args.count === true) {
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

  async update(as: As, args: { changes: DataDict; criteria: DataDict }) {
    assert(Object.keys(args.criteria).length > 0, "update: no criteria");

    const where = this.toWhere(as.types, args.criteria);
    const criteria = await this.bindCriteria(as.types, args.criteria);
    const { set, binds: set_binds } = await this.toSet(as.types, args.changes);
    const binds = { ...criteria, ...set_binds } as Binds;
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
    assert(Object.keys(args.criteria).length > 0, "delete: no criteria");

    const where = this.toWhere(as.types, args.criteria);
    const binds = await this.bindCriteria(as.types, args.criteria) as Binds;
    const query = `DELETE FROM ${this.table(as)} ${where}`;

    return this.#with<number>(async connection => {
      const [{ affectedRows }] = await connection.query<Result>(query, binds);

      return affectedRows;
    });
  };
}
