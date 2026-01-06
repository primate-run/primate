import typemap from "#typemap";
import type { As, DataDict, TypeMap } from "@primate/core/db";
import DB from "@primate/core/db/DB";
import assert from "@rcompat/assert";
import dict from "@rcompat/dict";
import entries from "@rcompat/dict/entries";
import type { Dict } from "@rcompat/type";
import { MongoClient } from "mongodb";
import p from "pema";

type Types = As["types"];

const schema = p({
  database: p.string,
  host: p.string.default("localhost"),
  password: p.string.optional(),
  port: p.uint.port().default(27017),
  username: p.string.optional(),
});

function make_limit(limit?: number) {
  assert.maybe.uint(limit);

  if (limit === undefined) return 0;
  return limit;
};

const null_to_set_unset = (changeset: DataDict) => {
  const changeset_entries = entries(changeset);

  const $set = changeset_entries.filter(([, value]) => value !== null).get();
  const $unset = changeset_entries.filter(([, value]) => value === null).get();

  return { $set, $unset };
};

const url_params = { directConnection: "true", replicaSet: "rs0" };

export default class MongoDB extends DB {
  static config: typeof schema.input;
  #factory: () => Promise<MongoClient>;
  #name: string;
  #client?: MongoClient;

  constructor(config?: typeof schema.input) {
    super();

    const { database, host, port } = schema.parse(config);
    const url = `mongodb://${host}:${port}?${dict.toQueryString(url_params)}`;
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
    assert.dict(args.record, "empty record");

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
    assert.dict(args.criteria);
    assert.maybe.true(args.count);

    this.toSelect(as.types, args.fields);
    this.toSort(as.types, args.sort);

    const binds = await this.#bind(args.criteria, as.types);
    const count = args.count ?? false;
    if (count) return (await this.#get(as.name)).countDocuments(binds);

    const fields = args.fields ?? [];
    const mapped = fields.map(f => f === "id" ? "_id" : f);

    const sort = args.sort === undefined || dict.empty(args.sort!)
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

  async update(as: As, args: { changeset: DataDict; criteria: DataDict }) {
    assert.nonempty(args.changeset, "empty changeset");
    assert.nonempty(args.criteria, "empty criteria");

    const criteria_binds = await this.#bind(args.criteria, as.types);
    const changeset_binds = await this.#bind(args.changeset, as.types) as DataDict;
    const collection = await this.#get(as.name);

    return (await collection
      .updateMany(criteria_binds, null_to_set_unset(changeset_binds)))
      .modifiedCount;
  }

  async delete(as: As, args: { criteria: DataDict }) {
    assert.nonempty(args.criteria, "empty criteria");

    const binds = await this.#bind(args.criteria, as.types);
    const collection = await this.#get(as.name);

    return (await collection.deleteMany(binds)).deletedCount;
  }
}
