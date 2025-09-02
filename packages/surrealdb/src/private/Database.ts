import typemap from "#typemap";
import Database from "@primate/core/Database";
import type As from "@primate/core/database/As";
import type DataDict from "@primate/core/database/DataDict";
import type Sort from "@primate/core/database/Sort";
import type TypeMap from "@primate/core/database/TypeMap";
import type Types from "@primate/core/database/Types";
import assert from "@rcompat/assert";
import type Dict from "@rcompat/type/Dict";
import { surrealdbNodeEngines } from "@surrealdb/node";
import pema from "pema";
import type StoreSchema from "pema/StoreSchema";
import string from "pema/string";
import uint from "pema/uint";
import type { QueryParameters } from "surrealdb";
import Surreal from "surrealdb";

type Count = { count: number }[];

const schema = pema({
  database: string,
  host: string.default("http://localhost"),
  namespace: string.optional(),
  password: string.optional(),
  path: string.default("/rpc"),
  port: uint.port().default(8000),
  username: string.optional(),
});

export default class SurrealDBDatabase extends Database {
  #factory: () => Promise<Surreal>;
  #client?: Surreal;

  static config: typeof schema.input;

  constructor(config?: typeof schema.input) {
    super("$");
    const {
      host, port, path,
      database, namespace, password, username,
    } = schema.parse(config);

    const url = `${host}:${port}/${path}`;
    const client = new Surreal({
      engines: surrealdbNodeEngines(),
    });
    const auth = username !== undefined && password !== undefined
      ? { password, username }
      : undefined;

    this.#factory = async () => {
      await client.connect(url, { auth, database, namespace });
      return client;
    };
  }

  async #get() {
    if (this.#client === undefined) {
      this.#client = await this.#factory();
    }
    return this.#client;
  }

  formatBinds(binds: Dict): Dict {
    return Object.fromEntries(
      Object.entries(binds).map(([k, v]) => [k.replace(/^[:$]/, ""), v]),
    );
  }

  async #query<T extends unknown[]>(...args: QueryParameters) {
    return (await this.#get()).query_raw<T>(...args);
  }

  get typemap() {
    return typemap as unknown as TypeMap<Dict>;
  }

  async close() {
    await (await this.#get()).close();
  }

  toWhere(types: Types, criteria: Dict) {
    const base = super.toWhere(types, criteria);
    if (!base) return base;

    return Object.entries(criteria).reduce((where, [k, v]) => {
      if (v !== null) {
        return where;
      }
      const column = this.ident(k);
      return where.replace(
        `${column} IS NULL`,
        `(${column} IS NULL OR ${column}=none)`);
    }, base.replace("`id`=$id", "`id`=<record>$id"));
  }

  async #new(name: string, store: StoreSchema) {
    const t = this.ident(name);
    const fields = Object.entries(store)
      // surreal auto-creates `id`
      .filter(([k]) => k !== "id")
      .map(([k, v]) => {
        const column = this.ident(k);
        const type = this.column(v.datatype);
        return `DEFINE FIELD ${column} ON TABLE ${t} TYPE option<${type}>;`;
      })
      .join("\n");

    const query = `DEFINE TABLE ${t} SCHEMALESS; ${fields}`;
    await this.#query(query);
  }

  async #drop(name: string) {
    await this.#query(`REMOVE TABLE ${this.ident(name)}`);
  }

  get schema() {
    return {
      create: this.#new.bind(this),
      delete: this.#drop.bind(this),
    };
  }

  async create<O extends Dict>(as: As, args: { record: DataDict }) {
    const table = this.table(as);
    const columns = Object.keys(args.record);
    const binds = await this.bind(as.types, args.record);
    const payload = columns.length > 0
      ? `(${columns.map(c => this.ident(c)).join(", ")}) VALUES
         (${columns.map(c => `$${c}`).join(", ")})`
      : " {}";
    const query = `INSERT INTO ${table} ${payload}`;
    const [{ result }] = await this.#query<[{ id: string }][]>(query, binds);
    const [created] = result as unknown as { id: string }[];
    const { id } = created;

    return this.unbind(as.types, { ...args.record, id }) as O;
  }

  read(as: As, args: { count: true; criteria: DataDict }): Promise<number>;
  read(as: As, args: {
    criteria: DataDict;
    fields?: string[];
    limit?: number;
    sort?: Sort;
  }): Promise<Dict[]>;
  async read(as: As, args: {
    count?: true;
    criteria: DataDict;
    fields?: string[];
    limit?: number;
    sort?: Sort;
  }) {
    const table = this.table(as);
    const binds = await this.bindCriteria(as.types, args.criteria);
    const where = this.toWhere(as.types, args.criteria);

    if (args.count === true) {
      const query = `SELECT count() AS count FROM ${table} ${where} GROUP ALL`;
      const [{ result }] = await this.#query<Count[]>(query, binds);
      const rows = result as Count;
      return rows[0]?.count ?? 0;
    }

    const sortKeys = Object.keys(args.sort ?? {});
    this.toSelect(as.types, args.fields);
    const projection = args.fields ?? [];
    const fields = projection.length === 0
      ? undefined
      : Array.from(new Set([...projection, ...sortKeys]));

    const select = this.toSelect(as.types, fields);
    const sort = this.toSort(as.types, args.sort);
    const limit = this.toLimit(args.limit);

    const query = `SELECT ${select} FROM ${table} ${where}${sort}${limit}`;

    const [{ result }] = await this.#query<Dict[][]>(query, binds);
    const records = (result as Dict[]).map(r => this.unbind(as.types, r));

    // strip sort keys back out
    if (projection.length > 0) {
      const want = new Set(projection);
      return records.map(r =>
        Object.fromEntries(Object.entries(r).filter(([k]) => want.has(k))),
      ) as Dict[];
    }

    return records;
  }

  async update(as: As, args: { changes: DataDict; criteria: DataDict }) {
    assert(Object.keys(args.criteria).length > 0, "update: no criteria");

    const table = this.table(as);
    const where = this.toWhere(as.types, args.criteria);
    const criteria = await this.bindCriteria(as.types, args.criteria);
    const { set, binds } = await this.toSet(as.types, args.changes);
    const set_binds = Object.fromEntries(
      Object.entries(binds).map(([k, v]) => [k, v === null ? undefined : v]),
    );

    const query = `UPDATE ${table} ${set} ${where}`;

    const [{ result }] = await this.#query<unknown[][]>(query,
      { ...criteria, ...set_binds });

    return result.length;
  }

  async delete(as: As, args: { criteria: DataDict }) {
    assert(Object.keys(args.criteria).length > 0, "delete: no criteria");

    const table = this.table(as);
    const where = this.toWhere(as.types, args.criteria);
    const binds = await this.bindCriteria(as.types, args.criteria);

    const query = `DELETE FROM ${table} ${where} RETURN diff`;
    const [{ result }] = await this.#query<unknown[][]>(query, binds);

    return (result as unknown[]).length;
  }
}
