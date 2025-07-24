import typemap from "#typemap";
import type As from "@primate/core/db/As";
import Database from "@primate/core/db/Database";
import type DataDict from "@primate/core/db/DataDict";
import type TypeMap from "@primate/core/db/TypeMap";
import is from "@rcompat/assert/is";
import maybe from "@rcompat/assert/maybe";
import entries from "@rcompat/record/entries";
import type Dict from "@rcompat/type/Dict";
import type {
  Connection, Pool, ResultSetHeader as Result, RowDataPacket as RowData,
} from "mysql2/promise";
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

function make_where(bindings: Dict) {
  const keys = Object.keys(bindings);

  if (keys.length === 0) {
    return "";
  }

  return `where ${keys.map(key => `\`${key}\`=:${key}`).join(" and ")}`;
};

const change = (bindings: Dict) => {
  const keys = Object.keys(bindings);

  const set = keys.map(field => `${field}=:s_${field}`).join(",");
  return {
    set: `SET ${set}`,
    bindings: entries(bindings).keymap(([key]) => `s_${key}`).get(),
  };
};

export default class MySQLDatabase extends Database {
  #client: Pool;

  constructor(client: Pool) {
    super();

    this.#client = client;
  }

  get typemap() {
    return typemap as unknown as TypeMap<Dict>;
  }

  async close() {
    await this.#client.end();
  }

  async #with<T>(executor: (connection: Connection) => Promise<unknown>) {
    const connection = await this.#client.getConnection();
    try {
      return await executor(connection) as T;
    } finally {
      this.#client.releaseConnection(connection);
    }
  }

  async #new(name: string, schema: StoreSchema) {
    const body = Object.entries(schema)
      .map(([key, value]) => `\`${key}\` ${this.column(value.datatype)}`)
      .join(",");
    const query = `CREATE TABLE IF NOT EXISTS ${name} (${body})`;

    await this.#with(async connection => {
      await connection.query(query);
    });
  }

  async #drop(name: string) {
    const query = `DROP TABLE IF EXISTS ${name}`;
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
    const columns = keys.map(key => `\`${key}\``);
    const values = keys.map(key => `:${key}`).join(",");
    const $predicate = `(${columns.join(",")}) VALUES (${values})`;
    const query = `INSERT INTO ${as.name} ${$predicate}`;
    const bindings = await this.bind(args.record, as.types);

    return this.#with(async connection => {
      const [{ insertId }] = await connection.query<Result>(query, bindings);

      return this.unbind({ ...args.record, id: insertId }, as.types) as O;
    }) as Promise<O>;
  }

  read(as: As, args: {
    criteria: DataDict;
    count: true;
  }): Promise<number>;
  read(as: As, args: {
    criteria: DataDict;
    fields?: string[];
    sort?: Dict<"asc" | "desc">;
    limit?: number;
  }): Promise<Dict[]>;
  async read(as: As, args: {
    criteria: DataDict;
    fields?: string[];
    count?: true;
    sort?: Dict<"asc" | "desc">;
    limit?: number;
  }) {
    const bindings = await this.bind(args.criteria, as.types);
    const where = make_where(bindings);

    if (args.count === true) {
      const query = `SELECT COUNT(*) AS n FROM ${as.name} ${where}`;
      return this.#with(async connection => {
        const [[{ n }]] = await connection.query<RowData[]>(query, bindings);
        return Number(n);
      });
    }

    const fields = args.fields ?? [];
    const sort = make_sort(args.sort ?? {});
    const limit = make_limit(args.limit);
    const select = fields.length === 0 ? "*" : fields.join(", ");
    const query = `SELECT ${select} FROM ${as.name} ${where}${sort}${limit};`;

    return this.#with(async connection => {
      const [records] = await connection.query<RowData[]>(query, bindings);

      return records.map(record => this.unbind(record, as.types));
    });
  }

  async update(as: As, args: {
    criteria: DataDict;
    changes: DataDict;
    sort?: Dict<"asc" | "desc">;
    limit?: number;
  }) {
    const criteria_bindings = await this.bind(args.criteria, as.types);
    const changes = await this.bind(args.changes, as.types);
    const where = make_where(criteria_bindings);
    const { set, bindings: set_bindings } = change(changes);
    const bindings = { ...criteria_bindings, ...set_bindings };
    const sort = make_sort(args.sort ?? {});

    const query = `
      UPDATE ${as.name}
      ${set}
      WHERE id IN (
        SELECT id FROM (
          SELECT id FROM ${as.name}
          ${where}
          ${sort}
        ) AS to_update
      );
    `;

    return this.#with<number>(async connection => {
      const [{ affectedRows }] = await connection
        .query<Result>(query, bindings);

      return affectedRows;
    });
  }

  async delete(as: As, args: { criteria: DataDict }) {
    const bindings = await this.bind(args.criteria, as.types);
    const where = make_where(bindings);
    const query = `DELETE FROM ${as.name} ${where}`;

    return this.#with<number>(async connection => {
      const [{ affectedRows }] = await connection
        .query<Result>(query, bindings);

      return affectedRows;
    });
  };
}
