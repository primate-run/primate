import AppError from "#AppError";
import is from "@rcompat/assert/is";
import type PartialDict from "@rcompat/type/PartialDict";

type Contents = PartialDict<string>;
type Normalize = (key: string) => string;

interface Schema<T> {
  parse(input: unknown): T;
}

type Options = {
  normalize?: Normalize;
  raw?: string;
};

export default class RequestBag {
  #contents: Contents;
  #name: string;
  #normalize: Normalize;
  #raw: string;

  /**
   * Create a new RequestBag.
   *
   * @param input - Initial key-value entries.
   * @param name - Human-readable bag name used in error messages.
   * @param options - Optional `normalize` function and `raw` string.
   */
  constructor(input: Contents, name: string, options: Options = {}) {
    is(input).object();

    this.#name = name;
    this.#normalize = options.normalize ?? (k => k);
    this.#raw = options.raw ?? "";

    const contents: Contents = Object.create(null);
    for (const key of Object.keys(input)) {
      const normalized = this.#normalize(key);
      // last-wins semantics if only case differs
      contents[normalized] = input[key];
    }
    this.#contents = contents;
  }

  #hasOwn(k: string) {
    return Object.hasOwn(this.#contents, k);
  }

  /**
   * The untouched, original source string for this bag. For example,
   * - `"?a=1&b=2"` for a query bag,
   * - the Cookie header for cookies,
   * - the pathname for request path.
   */
  get raw() {
    return this.#raw;
  }

  /**
   * @returns the number of elements in the bag.
   */
  get size() {
    return Object.keys(this.#contents).length;
  }

  /**
   * Iterate over `[key, value]` entries in the bag.
   * Keys are post-normalization; entries with `undefined` values are skipped.
   */
  *[Symbol.iterator](): IterableIterator<readonly [string, string]> {
    for (const k of Object.keys(this.#contents)) {
      const v = this.#contents[k];
      if (v !== undefined) yield [k, v] as const;
    }
  }

  /**
   * Get a value by key (strict).
   *
   * @param key - Key to look up (pre-normalization).
   * @returns The defined value.
   * @throws {AppError} If the key is absent or its value is `undefined`.
   */
  get(key: string): string {
    const k = this.#normalize(key);

    if (this.#hasOwn(k)) {
      const v = this.#contents[k];
      if (v !== undefined) return v;
    }

    throw new AppError("{0} has no key {1}", this.#name, key);
  }

  /**
   * Try to get a value by key (lenient).
   *
   * @param key - Key to look up (pre-normalization).
   * @returns The value, or `undefined` if absent/undefined.
   */
  try(key: string): string | undefined {
    const k = this.#normalize(key);

    return this.#hasOwn(k) ? this.#contents[k] : undefined;
  }

  /**
   * Whether the bag contains a defined value for the key.
   *
   * @param key - Key to test (pre-normalization).
   * @returns `true` if present with a defined value; otherwise `false`.
   */
  has(key: string): boolean {
    const k = this.#normalize(key);

    return this.#hasOwn(k) && this.#contents[k] !== undefined;
  }

  /**
   * Parse the entire bag with a schema.
   *
   * The schema receives the bag's normalized contents.
   *
   * @typeParam T - Parsed/validated result type.
   * @param schema - Object exposing `parse(input)`.
   * @returns The parsed value.
   * @throws Whatever the schema throws.
   */
  parse<T>(schema: Schema<T>): T {
    return schema.parse(this.#contents);
  }

  /** Returns {@link raw}. Useful in template strings. */
  toString() {
    return this.raw;
  }

  /**
   * JSON view of the normalized bag.
   *
   * @returns A shallow null-prototype clone of the bag's contents.
   */
  toJSON() {
    return Object.assign(Object.create(null), this.#contents);
  }
}
