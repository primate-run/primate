import Database from "#Database";
import Module from "@primate/core/database/Module";
import pema from "pema";
import string from "pema/string";
import uint from "pema/uint";
import postgres from "postgres";

const schema = pema({
  database: string,
  host: string.default("localhost"),
  password: string.optional(),
  port: uint.port().default(5432),
  username: string.optional(),
});

export default class PostgreSQLModule extends Module {
  static config: typeof schema.input;
  #config: typeof schema.infer;
  #database?: Database;

  constructor(config?: typeof schema.input) {
    super();

    this.#config = schema.parse(config);
  }

  deinit() {
    this.#database?.close();
  }

  init() {
    this.#database = new Database(postgres({
      db: this.#config.database,
      host: this.#config.host,
      pass: this.#config.password,
      port: this.#config.port,
      user: this.#config.username,
    }));
    return this.#database;
  }
}
