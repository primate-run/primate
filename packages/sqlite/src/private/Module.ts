import Database from "#Database";
import Module from "@primate/core/database/Module";
import Client from "@rcompat/sqlite";
import pema from "pema";
import string from "pema/string";

const schema = pema({
  database: string.default(":memory:"),
});

export default class Sqlite extends Module {
  #config: typeof schema.infer;

  static config: typeof schema.input;

  constructor(config?: typeof schema.input) {
    super();

    this.#config = schema.parse(config);
  }

  init() {
    const options = { safeIntegers: true };

    return new Database(new Client(this.#config.database, options));
  }

  deinit() { }
}
