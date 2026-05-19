import E from "#errors";
import type { Dict } from "@rcompat/type";

export default class Bag {
  #entries: Dict;
  #resolve: (name: string) => string;

  constructor(entries: [string, unknown][], resolve: (name: string) => string) {
    this.#entries = Object.fromEntries(entries);
    this.#resolve = resolve;
  }

  get<T>(name: string): T {
    const value = this.#entries[this.#resolve(name)];
    if (value === undefined) throw E.bag_value_missing(name);
    return value as T;
  }

  try(name: string): unknown | undefined {
    return this.#entries[this.#resolve(name)];
  }

  has(name: string): boolean {
    return this.#resolve(name) in this.#entries;
  }

  keys() {
    return Object.keys(this.#entries);
  }

  values() {
    return Object.values(this.#entries);
  }

  entries() {
    return Object.entries(this.#entries);
  }
}
