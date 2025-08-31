import is from "@rcompat/assert/is";
import FileRef from "@rcompat/fs/FileRef";
import type JSONValue from "@rcompat/type/JSONValue";
import SessionManager from "primate/session/Manager";

export default class FileSessionManager extends SessionManager<unknown> {
  #directory: FileRef;

  constructor(directory: string = "/tmp/sessions") {
    is(directory).string();

    super();
    this.#directory = new FileRef(directory);
  }

  async init() {
    await this.#directory.create({ recursive: true });
  }

  async load(id: string) {
    is(id).uuid("invalid session id");

    try {
      return await this.#directory.join(id).json();
    } catch {
      return undefined;
    }
  }

  async create(id: string, data: JSONValue) {
    is(id).uuid("invalid session id");

    await this.#directory.join(id).writeJSON(data);
  }

  async save(id: string, data: JSONValue) {
    await this.create(id, data);
  }

  async destroy(id: string) {
    is(id).uuid("invalid session id");

    await this.#directory.join(id).remove();
  }
}
