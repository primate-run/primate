import kSerialize from "#session/k-serialize";
import assert from "@rcompat/assert";
import type { Schema } from "@rcompat/type";

export default class SessionHandle<Data> {
  #id?: string;
  #data?: Data;
  #schema: Schema<Data>;
  #dirty = false;

  constructor(id?: string, data?: Data, schema?: Schema<Data>) {
    assert.maybe.uuid(id);
    assert.maybe.dict(data);
    assert.maybe.object(schema);
    assert.maybe.function(schema?.parse);
    assert.true((id === undefined) === (data === undefined),
      "both `id` and `data` must be defined or undefined",
    );

    this.#id = id;
    this.#data = data;
    this.#schema = schema?.parse ? schema : { parse: (x: unknown) => x as Data };
  }

  get exists() {
    return this.#id !== undefined;
  }

  get id() {
    return this.#id;
  }

  get(): Readonly<Data> {
    if (!this.exists) throw new Error("session does not exist");

    return this.#data as Data;
  }

  try(): Readonly<Data> | undefined {
    return this.exists ? this.#data : undefined;
  }

  create(initial?: Data): void {
    // idempotent noop
    if (this.exists) return;

    const parsed = this.#schema.parse(initial ?? {});
    this.#id = crypto.randomUUID();
    this.#data = parsed;
    this.#dirty = true;
  }

  set(next: ((previous: Readonly<Data>) => Data) | Data) {
    if (!this.exists) throw new Error("cannot set() on non-existent session");

    const previous = this.#data as Readonly<Data>;
    // @ts-expect-error TEST
    const candidate = typeof next === "function" ? next(previous) : next;
    this.#data = this.#schema.parse(candidate);
    this.#dirty = true;
  }

  destroy() {
    if (!this.exists) return;
    this.#id = undefined;
    this.#data = undefined;
    this.#dirty = true;
  }

  [kSerialize]() {
    return {
      data: this.#data,
      dirty: this.#dirty,
      exists: this.exists,
      id: this.#id,
    };
  }
}
