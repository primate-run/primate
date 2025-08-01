import Database from "#Database";
import Module from "@primate/core/db/Module";
import toQueryString from "@rcompat/record/toQueryString";
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

export default class MongoDBModule extends Module {
  #config: typeof schema.infer;
  #db?: Database;

  static config: typeof schema.input;

  constructor(config?: typeof schema.input) {
    super();

    this.#config = schema.validate(config);
  }

  async init() {
    const { database, host, port } = this.#config;
    const params = {
      directConnection: "true",
      replicaSet: "rs0",
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
