import AppError from "#AppError";
import is from "@rcompat/assert/is";
import type PartialDict from "@rcompat/type/PartialDict";

type Contents = PartialDict<string>;

type Normalize = (key: string) => string;

interface Schema<T> {
  parse(input: unknown): T;
}

export default class RequestBag {
  #contents: Contents;
  #name: string;
  #normalize: Normalize;

  constructor(input: Contents, name: string, normalize?: Normalize) {
    is(input).object();

    this.#name = name;
    this.#normalize = normalize ?? (k => k);

    const contents: Contents = Object.create(null);
    for (const key of Object.keys(input)) {
      const normalized = this.#normalize(key);
      // last-wins semantics if only case differs
      contents[normalized] = input[key];
    }
    this.#contents = contents;
  }

  /**
   * Get a value by key.
   * @param key - key to look up (pre-normalization).
   * @returns The value.
   * @throws `AppError` If the key is absent or its value is undefined.
   */
  get(key: string): string {
    const k = this.#normalize(key);
    const v = Object.hasOwn(this.#contents, k) ? this.#contents[k] : undefined;

    if (v !== undefined) return v;

    throw new AppError("{0} has no key {1}", this.#name, key);
  }

  /**
   * Try to get a value by key.
   * @param key - Key to look up (pre-normalization).
   * @returns The value, or undefined if absent/undefined.
   */
  try(key: string): string | undefined {
    const k = this.#normalize(key);
    const v = Object.hasOwn(this.#contents, k) ? this.#contents[k] : undefined;

    return v === undefined ? undefined : v;
  }

  /**
   * Whether the bag contains a defined value for the key.
   * @param key - Key to test (pre-normalization).
   * @returns `true` if present with a defined value; otherwise `false`.
   */
  has(key: string): boolean {
    const nkey = this.#normalize(key);

    return Object.hasOwn(this.#contents, nkey) &&
      this.#contents[nkey] !== undefined;
  }

  /**
   * Parse the entire bag with a schema.
   * The schema receives the normalized contents (null-prototype dictionary).
   * @template T
   * @param schema - Schema exposing `parse(input)`.
   * @returns The parsed value.
   * @throws Whatever the schema throws.
   */
  as<T>(schema: Schema<T>): T {
    return schema.parse(this.#contents);
  }

  toJSON() {
    return Object.assign(Object.create(null), this.#contents);
  }
}
