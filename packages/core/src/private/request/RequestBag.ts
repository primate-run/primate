import E from "#errors";
import assert from "@rcompat/assert";
import fn from "@rcompat/fn";
import symbol from "@rcompat/symbol";
import type { Dict } from "@rcompat/type";

type Normalize<T> = (key: keyof T & string) => string;
type Options<T> = {
  normalize?: Normalize<T>;
  raw?: string;
};

export default class RequestBag<T extends Dict = Dict<string>> {
  #contents: T;
  #name: string;
  #normalize: Normalize<T>;
  #raw: string;

  [symbol.parse]() {
    return this.toJSON();
  }

  /**
   * Create a new RequestBag.
   *
   * @param input - Initial key-value entries.
   * @param name - Human-readable bag name used in error messages.
   * @param options - Optional `normalize` function and `raw` string.
   */
  constructor(input: T, name: string, options?: Options<T>) {
    assert.dict(input);
    assert.string(name);
    assert.maybe.dict(options);
    assert.maybe.function(options?.normalize);
    assert.maybe.string(options?.raw);
    this.#name = name;
    this.#normalize = options?.normalize ?? (fn.identity as Normalize<T>);
    this.#raw = options?.raw ?? "";
    const contents = Object.create(null) as T;
    for (const key of Object.keys(input as object)) {
      contents[this.#normalize(key as keyof T & string) as keyof T] =
        input[key as keyof T];
    }
    this.#contents = contents;
  }

  #hasOwn(k: string) {
    return Object.hasOwn(this.#contents as object, k);
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
    return Object.keys(this.#contents as object).length;
  }

  /**
   * Iterate over `[key, value]` entries in the bag.
   * Keys are post-normalization; entries with `undefined` values are skipped.
   */
  *[Symbol.iterator](): IterableIterator<[keyof T & string, T[keyof T & string]]> {
    for (const k of Object.keys(this.#contents as object)) {
      const v = this.#contents[k as keyof T];
      if (v !== undefined) {
        yield [k as keyof T & string, v as T[keyof T & string]] as const;
      }
    }
  }

  /**
   * Get a value by key.
   *
   * @param key - Key to look up (pre-normalization).
   * @returns The defined value.
   * @throws If the key is absent or its value is `undefined`.
   */
  get<K extends keyof T & string>(key: K): T[K] {
    const k = this.#normalize(key) as keyof T;
    if (this.#hasOwn(k as string)) {
      const v = this.#contents[k];
      if (v !== undefined) return v as T[K];
    }
    throw E.request_bag_missing_key(this.#name, key);
  }

  /**
   * Try to get a value by key.
   *
   * @param key - Key to look up (pre-normalization).
   * @returns The value, or `undefined` if absent/undefined.
   */
  try<K extends keyof T & string>(key: K): T[K] | undefined {
    const k = this.#normalize(key) as keyof T;
    return this.#hasOwn(k as string) ? this.#contents[k] as T[K] : undefined;
  }

  /**
   * Whether the bag contains a defined value for the key.
   *
   * @param key - Key to test (pre-normalization).
   * @returns `true` if present with a defined value; otherwise `false`.
   */
  has<K extends keyof T & string>(key: K): boolean {
    const k = this.#normalize(key) as keyof T;
    return this.#hasOwn(k as string) && this.#contents[k] !== undefined;
  }

  /** Returns {@link raw}. Useful in template strings. */
  toString() {
    return this.#raw;
  }

  /**
   * JSON view of the normalized bag.
   *
   * @returns A shallow null-prototype clone of the bag's contents.
   */
  toJSON(): T {
    return Object.assign(Object.create(null), this.#contents);
  }
}
