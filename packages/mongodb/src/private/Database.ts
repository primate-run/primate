import typemap from "#typemap";
import type As from "@primate/core/db/As";
import Database from "@primate/core/db/Database";
import type DataDict from "@primate/core/db/DataDict";
import type TypeMap from "@primate/core/db/TypeMap";
import type Types from "@primate/core/db/Types";
import maybe from "@rcompat/assert/maybe";
import empty from "@rcompat/record/empty";
import entries from "@rcompat/record/entries";
import type Dict from "@rcompat/type/Dict";
import type { MongoClient } from "mongodb";

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

export default class MongoDBDatabase extends Database {
  #client: MongoClient;
  #name: string;

  constructor(client: MongoClient, name: string) {
    super();

    this.#client = client;
    this.#name = name;
  }

  #with(collection: string) {
    return this.#client.db(this.#name).collection(collection);
  }

  get typemap() {
    return typemap as unknown as TypeMap<Dict>;
  }

  async close() {
    await this.#client.close();
  }

  async #drop(name: string) {
    await this.#with(name).drop();
  }

  get schema() {
    return {
      // noop
      create: () => undefined,
      delete: this.#drop.bind(this),
    };
  }

  async #bind(object: DataDict, types: Types) {
    const { id, ...rest } = await this.bind(object, types);

    return id === undefined
      ? rest
      : { _id: id, ...rest };
  }

  #unbind(object: Dict, types: Types) {
    const { _id: id, ...rest } = object;

    return this.unbind(id === undefined
      ? rest
      : { id, ...rest }, types);
  }

  async create<O extends Dict>(as: As, args: { record: DataDict }) {
    const bound = await this.#bind(args.record, as.types);

    const { insertedId: _id } = await this.#with(as.name).insertOne(bound);

    return this.#unbind({ ...args.record, _id }, as.types) as O;
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
    const bound = await this.#bind(args.criteria, as.types);
    if (args.count === true) {
      return this.#with(as.name).countDocuments(bound);
    }

    const fields = args.fields ?? [];
    const sort = args.sort === undefined || empty(args.sort!)
      ? {}
      : { sort: args.sort };
    const select = fields.length === 0
      ? {}
      : {
        projection: {
          // erase _id unless explicit in projection
          _id: 0,
          ...Object.fromEntries(fields.map(field => [field, 1])),
        },
      };

    const options = { ...select, ...sort, useBigInt64: true };
    const records = await this.#with(as.name)
      .find(bound, options)
      .limit(make_limit(args.limit))
      .toArray();

    return records.map(record => this.#unbind(record, as.types));
  }

  async update(as: As, args: {
    criteria: DataDict;
    changes: DataDict;
    sort?: Dict<"asc" | "desc">;
    limit?: number;
  }) {
    const bound_criteria = await this.#bind(args.criteria, as.types);
    const bound_changes = await this.#bind(args.changes, as.types);

    return (await this.#with(as.name)
      .updateMany(bound_criteria, null_to_set_unset(bound_changes)))
      .modifiedCount;
  }

  async delete(as: As, args: { criteria: DataDict }) {
    const bound = await this.#bind(args.criteria, as.types);

    return (await this.#with(as.name).deleteMany(bound)).deletedCount;
  }
}
