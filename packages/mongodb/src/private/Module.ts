import Database from "#Database";
import Module from "@primate/core/db/Module";
import toQueryString from "@rcompat/record/toQueryString";
import { MongoClient } from "mongodb";
import pema from "pema";
import string from "pema/string";
import uint from "pema/uint";

const schema = pema({
  host: string.default("localhost"),
  port: uint.port().default(27017),
  database: string,
  username: string.optional(),
  password: string.optional(),
});

export default class MongoDBModule extends Module {
  #config: typeof schema.infer;
  #db?: Database;

  static config: typeof schema.input;

  constructor(config?: typeof schema.input) {
    super();

    this.#config = schema.validate(config);
  }

  async init() {
    const { host, port, database } = this.#config;
    const params = {
      replicaSet: "rs0",
      directConnection: "true",
    };
    const url = `mongodb://${host}:${port}?${toQueryString(params)}`;
    const client = new MongoClient(url);
    await client.connect();
    this.#db = new Database(client, database);
    return this.#db;
  }

  deinit() {
    this.#db?.close();
  }
}
