import Database from "#Database";
import Module from "@primate/core/db/Module";
import mysql from "mysql2/promise";
import pema from "pema";
import string from "pema/string";
import uint from "pema/uint";

const schema = pema({
  host: string.default("localhost"),
  port: uint.port().default(3306),
  database: string.optional(),
  username: string.optional(),
  password: string.optional(),
});

export default class MySQLModule extends Module {
  #config: typeof schema.infer;
  #db?: Database;

  static config: typeof schema.input;

  constructor(config?: typeof schema.input) {
    super();

    this.#config = schema.validate(config);
  }

  init() {
    this.#db = new Database(mysql.createPool({
      host: this.#config.host,
      port: this.#config.port,
      database: this.#config.database,
      user: this.#config.username,
      password: this.#config.password,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      namedPlaceholders: true,
      bigNumberStrings: true,
      supportBigNumbers: true,
    }));
    return this.#db;
  }

  deinit() {
    this.#db?.close();
  }
}
