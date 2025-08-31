import SessionManager from "#session/Manager";
import assert from "@rcompat/assert";

export default class InMemorySessionManager<Data> extends SessionManager<Data> {
  // id -> JSON
  #sessions = new Map<string, string>();

  load(id: string): Data | undefined {
    const raw = this.#sessions.get(id);

    return raw === undefined ? undefined : JSON.parse(raw) as Data;
  }

  create(id: string, data: Data): void {
    assert(!this.#sessions.has(id), `session already exists: ${id}`);

    this.#sessions.set(id, JSON.stringify(data));
  }

  save(id: string, data: Data): void {
    assert(this.#sessions.has(id), `session not found: ${id}`);

    this.#sessions.set(id, JSON.stringify(data));
  }

  // idempotent
  destroy(id: string): void {
    this.#sessions.delete(id);
  }
}
