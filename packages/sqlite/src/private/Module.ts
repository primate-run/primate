import Module from "@primate/core/db/Module";
import Database from "#Database";
import Client from "@rcompat/sqlite";
import is from "@rcompat/assert/is";

export default class Sqlite extends Module {
  #path: string;

  constructor(path: string = ":memory:") {
    super();

    is(path).string();

    this.#path = path;
  }

  init() {
    return new Database(new Client(this.#path, { safeIntegers: true }));
  }

  deinit() {}
}
