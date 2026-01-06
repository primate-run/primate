import typemap from "#typemap";
import type { As, DataDict, Sort, TypeMap } from "@primate/core/db";
import DB from "@primate/core/db/DB";
import assert from "@rcompat/assert";
import type { Dict } from "@rcompat/type";
import { surrealdbNodeEngines } from "@surrealdb/node";
import type { StoreSchema } from "pema";
import p from "pema";
import type { QueryParameters } from "surrealdb";
import Client from "surrealdb";

type Count = { count: number }[];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const schema = p({
  database: p.string,
  host: p.string.default("http://localhost"),
  namespace: p.string.optional(),
  password: p.string.optional(),
  path: p.string.default("/rpc"),
  port: p.uint.port().default(8000),
  username: p.string.optional(),
});

export default class SurrealDB extends DB {
  #factory: () => Promise<Client>;
  #client?: Client;

  static config: typeof schema.input;

  constructor(config?: typeof schema.input) {
    super("$");
    const {
      host, port, path,
      database, namespace, password, username,
    } = schema.parse(config);

    const url = `${host}:${port}/${path}`;
    const client = new Client({
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

  toWhere(types: As["types"], criteria: DataDict) {
    const base = super.toWhere(types, criteria);
    if (!base) return base;

    return Object.entries(criteria).reduce((where, [k, v]) => {
      const column = this.ident(k);

      if (v === null) {
        const replacement = where.replace(
          `${column} IS NULL`,
          `(${column} IS NULL OR ${column}=none)`,
        );

        return replacement;
      }
      if (typeof v === "object" && "$like" in v) {
        const like = String(v.$like);
        const re = `^${escape(like).replace(/%/g, ".*").replace(/_/g, ".")}$`;
        const s_re = JSON.stringify(re);

        return where.replace(
          `${column} LIKE $${k}`,
          `${column} != none AND string::matches(${column}, ${s_re})`,
        );
      }

      // unchanged from base
      return where;
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
    assert.dict(args.record, "empty record");

    const columns = Object.keys(args.record);
    const binds = await this.bind(as.types, args.record);
    const table = this.table(as);
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
    assert.dict(args.criteria);
    assert.maybe.true(args.count);

    const table = this.table(as);
    const binds = await this.bindCriteria(as.types, args.criteria);
    const where = this.toWhere(as.types, args.criteria);

    if (args.count ?? false) {
      const query = `SELECT count() AS count FROM ${table} ${where} GROUP ALL`;
      const [{ result }] = await this.#query<Count[]>(query, binds);
      const rows = result as Count;
      return rows[0]?.count ?? 0;
    }

    const sort_keys = Object.keys(args.sort ?? {});
    this.toSelect(as.types, args.fields);
    const projection = args.fields ?? [];
    const fields = projection.length === 0
      ? undefined
      : Array.from(new Set([...projection, ...sort_keys]));

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

  async update(as: As, args: { changeset: DataDict; criteria: DataDict }) {
    assert.nonempty(args.changeset, "empty changeset");
    assert.nonempty(args.criteria, "empty criteria");

    const table = this.table(as);
    const where = this.toWhere(as.types, args.criteria);
    const criteria_binds = await this.bindCriteria(as.types, args.criteria);
    const { set, binds } = await this.toSet(as.types, args.changeset);
    const set_binds = Object.fromEntries(
      Object.entries(binds).map(([k, v]) => [k, v === null ? undefined : v]),
    );
    const query = `UPDATE ${table} ${set} ${where}`;
    const [{ result }] = await this.#query<unknown[][]>(query,
      { ...criteria_binds, ...set_binds });

    return result.length;
  }

  async delete(as: As, args: { criteria: DataDict }) {
    assert.nonempty(args.criteria, "empty criteria");

    const table = this.table(as);
    const where = this.toWhere(as.types, args.criteria);
    const binds = await this.bindCriteria(as.types, args.criteria);
    const query = `DELETE FROM ${table} ${where} RETURN diff`;
    const [{ result }] = await this.#query<unknown[][]>(query, binds);

    return (result as unknown[]).length;
  }
}
