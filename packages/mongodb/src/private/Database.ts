import typemap from "#typemap";
import Database from "@primate/core/Database";
import type As from "@primate/core/database/As";
import type DataDict from "@primate/core/database/DataDict";
import type TypeMap from "@primate/core/database/TypeMap";
import type Types from "@primate/core/database/Types";
import assert from "@rcompat/assert";
import maybe from "@rcompat/assert/maybe";
import empty from "@rcompat/record/empty";
import entries from "@rcompat/record/entries";
import toQueryString from "@rcompat/record/toQueryString";
import type Dict from "@rcompat/type/Dict";
import { MongoClient } from "mongodb";
import pema from "pema";
import string from "pema/string";
import uint from "pema/uint";

const schema = pema({
  database: string,
  host: string.default("localhost"),
  password: string.optional(),
  port: uint.port().default(27017),
  username: string.optional(),
});

function make_limit(limit?: number) {
  maybe(limit).usize();

  if (limit === undefined) {
    return 0;
  }
  return limit;
};

const null_to_set_unset = (changes: DataDict) => {
  const entry_changes = entries(changes);

  const $set = entry_changes.filter(([, value]) => value !== null).get();
  const $unset = entry_changes.filter(([, value]) => value === null).get();

  return { $set, $unset };
};

const url_params = { directConnection: "true", replicaSet: "rs0" };

export default class MongoDBDatabase extends Database {
  static config: typeof schema.input;
  #factory: () => Promise<MongoClient>;
  #name: string;
  #client?: MongoClient;

  constructor(config?: typeof schema.input) {
    super();

    const { database, host, port } = schema.parse(config);
    const url = `mongodb://${host}:${port}?${toQueryString(url_params)}`;
    const client = new MongoClient(url);

    this.#name = database;
    this.#factory = async () => {
      await client.connect();
      return client;
    };
  }

  async #get(collection: string) {
    if (this.#client === undefined) {
      this.#client = await this.#factory();
    }
    return this.#client.db(this.#name).collection(collection);
  }

  get typemap() {
    return typemap as unknown as TypeMap<Dict>;
  }

  async close() {
    await this.#client!.close();
  }

  async #drop(name: string) {
    await (await this.#get(name)).drop();
  }

  get schema() {
    return {
      // noop
      create: () => undefined,
      delete: this.#drop.bind(this),
    };
  }

  async #bind(object: DataDict, types: Types) {
    const prepared: DataDict = Object.fromEntries(Object.entries(object)
      .map(([key, value]) => {
        if (value === null) return [key, null];

        if (typeof value === "object" && "$like" in value) {
          const pattern = String(value.$like);
          const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const $regex = `^${escaped.replace(/%/g, ".*").replace(/_/g, ".")}$`;
          return [key, { $regex }];
        }
        return [key, value];
      }));

    const { id, ...rest } = await this.bind(types, prepared);

    return id === undefined
      ? rest
      : { _id: id, ...rest };
  }

  #unbind(object: Dict, types: Types) {
    const { _id: id, ...rest } = object;

    return this.unbind(types, id === undefined ? rest : { id, ...rest });
  }

  async create<O extends Dict>(as: As, args: { record: DataDict }) {
    const binds = await this.#bind(args.record, as.types);

    const { insertedId } = await (await this.#get(as.name)).insertOne(binds);

    return this.#unbind({ ...args.record, _id: insertedId }, as.types) as O;
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
    this.toSelect(as.types, args.fields);
    this.toSort(as.types, args.sort);

    const binds = await this.#bind(args.criteria, as.types);
    if (args.count === true) {
      return (await this.#get(as.name)).countDocuments(binds);
    }

    const fields = args.fields ?? [];
    const mapped = fields.map(f => f === "id" ? "_id" : f);

    const sort = args.sort === undefined || empty(args.sort!)
      ? {}
      : { sort: args.sort };
    const select = mapped.length === 0
      ? {}
      : {
        projection: (() => {
          const out: Dict<0 | 1> = {};
          if (!mapped.includes("_id")) {
            out._id = 0;
          }
          for (const field of mapped) {
            out[field] = 1;
          }
          return out;
        })(),
      };

    const options = { ...select, ...sort, useBigInt64: true };
    const records = await (await this.#get(as.name))
      .find(binds, options)
      .limit(make_limit(args.limit))
      .toArray();

    return records.map(record => this.#unbind(record, as.types));
  }

  async update(as: As, args: { changes: DataDict; criteria: DataDict }) {
    assert(Object.keys(args.criteria).length > 0, "update: no criteria");

    const criteria_binds = await this.#bind(args.criteria, as.types);
    const changes_binds = await this.#bind(args.changes, as.types) as DataDict;
    const collection = await this.#get(as.name);

    return (await collection
      .updateMany(criteria_binds, null_to_set_unset(changes_binds)))
      .modifiedCount;
  }

  async delete(as: As, args: { criteria: DataDict }) {
    assert(Object.keys(args.criteria).length > 0, "delete: no criteria");

    const binds = await this.#bind(args.criteria, as.types);

    return (await ((await this.#get(as.name)).deleteMany(binds))).deletedCount;
  }
}
