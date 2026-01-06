import typemap from "#typemap";
import type { As, DataDict, TypeMap } from "@primate/core/db";
import DB from "@primate/core/db/DB";
import assert from "@rcompat/assert";
import type { Param } from "@rcompat/sqlite";
import Client from "@rcompat/sqlite";
import type { Dict } from "@rcompat/type";
import type { StoreSchema } from "pema";
import p from "pema";

type Binds = Param | undefined;

const schema = p({
  database: p.string.default(":memory:"),
});

const options = { safeIntegers: true };

export default class SQLite extends DB {
  #factory: () => Client;
  #client?: Client;

  static config: typeof schema.input;

  constructor(config?: typeof schema.input) {
    super("$");
    const parsed = schema.parse(config);
    this.#factory = () => new Client(parsed.database, options);
  }

  #get() {
    if (this.#client === undefined) this.#client = this.#factory();

    return this.#client;
  }

  close() {
    this.#get().close();
  }

  get typemap() {
    return typemap as unknown as TypeMap<Dict>;
  }

  #new(name: string, store: StoreSchema) {
    const body = Object.entries(store)
      .map(([key, value]) =>
        `${this.ident(key)} ${this.column(value.datatype)}`)
      .join(",");
    const query = `CREATE TABLE IF NOT EXISTS ${this.ident(name)} (${body})`;
    this.#get().prepare(query).run();
  }

  #drop(name: string) {
    const query = `DROP TABLE IF EXISTS ${this.ident(name)}`;
    this.#get().prepare(query).run();
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
    const values = keys.map(key => `$${key}`).join(",");
    const payload = columns.length > 0
      ? `(${columns.join(",")}) VALUES (${values})`
      : "DEFAULT VALUES";
    const query = `INSERT INTO ${this.table(as)} ${payload} RETURNING id;`;
    const binds = await this.bind(as.types, args.record) as Binds;
    const statement = this.#get().prepare(query);
    const changes = statement.run(binds);
    const id = BigInt(changes.lastInsertRowid);

    return this.unbind(as.types, { ...args.record, id }) as O;
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
    assert.dict(args.criteria, "empty criteria");
    assert.maybe.true(args.count);

    const where = this.toWhere(as.types, args.criteria);
    const binds = await this.bindCriteria(as.types, args.criteria) as Binds;

    if (args.count ?? false) {
      const query = `SELECT COUNT(*) AS n FROM ${this.table(as)} ${where};`;
      const [{ n }] = this.#get().prepare(query).all(binds);
      return Number(n);
    }

    const select = this.toSelect(as.types, args.fields);
    const sort = this.toSort(as.types, args.sort);
    const limit = this.toLimit(args.limit);

    const query = `SELECT
      ${select} FROM ${this.table(as)} ${where}${sort}${limit};`;
    const records = this.#get().prepare(query).all(binds);

    return records.map(record => this.unbind(as.types, record));
  }

  async update(as: As, args: { changeset: DataDict; criteria: DataDict }) {
    assert.nonempty(args.criteria, "empty criteria");
    assert.nonempty(args.changeset, "empty changeset");

    const where = this.toWhere(as.types, args.criteria);
    const criteria_binds = await this.bindCriteria(as.types, args.criteria);
    const { set, binds: changeset_binds } = await this.toSet(as.types, args.changeset);
    const binds = { ...criteria_binds, ...changeset_binds } as Binds;

    const query = `
      WITH to_update AS (
        SELECT id FROM ${this.table(as)}
        ${where}
      )
      UPDATE ${this.table(as)}
      ${set}
      WHERE id IN (SELECT id FROM to_update)
    `;

    return Number(this.#get().prepare(`${query};`).run(binds).changes);
  }

  async delete(as: As, args: { criteria: DataDict }) {
    assert.nonempty(args.criteria, "empty criteria");

    const where = this.toWhere(as.types, args.criteria);
    const binds = await this.bindCriteria(as.types, args.criteria) as Binds;
    const query = `DELETE FROM ${this.table(as)} ${where}`;

    return Number(this.#get().prepare(query).run(binds).changes);
  }
}
