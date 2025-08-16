import Database from "#Database";
import Module from "@primate/core/database/Module";
import { surrealdbNodeEngines } from "@surrealdb/node";
import pema from "pema";
import string from "pema/string";
import uint from "pema/uint";
import Surreal from "surrealdb";

const schema = pema({
  database: string,
  host: string.default("http://localhost"),
  namespace: string.optional(),
  password: string.optional(),
  path: string.default("/rpc"),
  port: uint.port().default(8000),
  username: string.optional(),
});

export default class SurrealDBModule extends Module {
  #config: typeof schema.infer;
  #database?: Database;

  static config: typeof schema.input;

  constructor(config?: typeof schema.input) {
    super();

    this.#config = schema.parse(config);
  }

  get #url() {
    const { host, path, port } = this.#config;

    return `${host}:${port}/${path}`;
  }

  get #options() {
    const { database, namespace, password, username } = this.#config;
    const auth = username !== undefined && password !== undefined
      ? { password, username }
      : undefined;

    return { auth, database, namespace };
  }

  async init() {
    const client = new Surreal({
      engines: surrealdbNodeEngines(),
    });
    await client.connect(this.#url, this.#options);
    this.#database = new Database(client);
    return this.#database;
  }

  deinit() {
    this.#database?.close();
  }
}
