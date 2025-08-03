import Database from "#Database";
import Module from "@primate/core/db/Module";
import mysql from "mysql2/promise";
import pema from "pema";
import string from "pema/string";
import uint from "pema/uint";

const schema = pema({
  database: string,
  host: string.default("localhost"),
  password: string.optional(),
  port: uint.port().default(3306),
  username: string.optional(),
});

export default class MySQLModule extends Module {
  static config: typeof schema.input;
  #config: typeof schema.infer;

  #db?: Database;

  constructor(config?: typeof schema.input) {
    super();

    this.#config = schema.validate(config);
  }

  deinit() {
    this.#db?.close();
  }

  init() {
    this.#db = new Database(mysql.createPool({
      bigNumberStrings: true,
      connectionLimit: 10,
      database: this.#config.database,
      enableKeepAlive: true,
      host: this.#config.host,
      keepAliveInitialDelay: 0,
      namedPlaceholders: true,
      password: this.#config.password,
      port: this.#config.port,
      queueLimit: 0,
      supportBigNumbers: true,
      user: this.#config.username,
      waitForConnections: true,
    }));
    return this.#db;
  }
}
