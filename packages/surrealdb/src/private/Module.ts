import Database from "#Database";
import Module from "@primate/core/db/Module";
import { surrealdbNodeEngines } from "@surrealdb/node";
import pema from "pema";
import string from "pema/string";
import uint from "pema/uint";
import Surreal from "surrealdb";

const schema = pema({
  host: string.default("http://localhost"),
  port: uint.port().default(8000),
  path: string.default("/rpc"),
  namespace: string.optional(),
  database: string,
  username: string.optional(),
  password: string.optional(),
});

export default class SurrealDBModule extends Module {
  #config: typeof schema.infer;
  #db?: Database;

  static config: typeof schema.input;

  constructor(config?: typeof schema.input) {
    super();

    this.#config = schema.validate(config);
  }

  get #url() {
    const { host, port, path } = this.#config;

    return `${host}:${port}/${path}`;
  }

  get #options() {
    const { namespace, database, username, password } = this.#config;
    const auth = username !== undefined && password !== undefined
      ? { username, password }
      : undefined;

    return { namespace, database, auth };
  }

  async init() {
    const client = new Surreal({
      engines: surrealdbNodeEngines(),
    });
    await client.connect(this.#url, this.#options);
    this.#db = new Database(client);
    return this.#db;
  }

  deinit() {
    this.#db?.close();
  }
}
