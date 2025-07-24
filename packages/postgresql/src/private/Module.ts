import Database from "#Database";
import Module from "@primate/core/db/Module";
import pema from "pema";
import string from "pema/string";
import uint from "pema/uint";
import postgres from "postgres";

const schema = pema({
  host: string.default("localhost"),
  port: uint.port().default(5432),
  database: string.optional(),
  username: string.optional(),
  password: string.optional(),
});

export default class PostgreSQLModule extends Module {
  #config: typeof schema.infer;
  #db?: Database;

  static config: typeof schema.input;

  constructor(config?: typeof schema.input) {
    super();

    this.#config = schema.validate(config);
  }

  init() {
    this.#db = new Database(postgres({
      host: this.#config.host,
      port: this.#config.port,
      db: this.#config.database,
      user: this.#config.username,
      pass: this.#config.password,
    }));
    return this.#db;
  }

  deinit() {
    this.#db?.close();
  }
}
