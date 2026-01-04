import type { Dict } from "@rcompat/type";

export default class RequestContext {
  #data = new Map<string, unknown>();

  set<T>(key: string, value: T): void {
    this.#data.set(key, value);
  }

  update<T>(key: string, fn: (prev: T | undefined) => T): void {
    const prev = this.try<T>(key);
    this.set(key, fn(prev));
  }

  has(key: string): boolean {
    return this.#data.has(key);
  }

  try<T>(key: string): T | undefined {
    return this.#data.get(key) as T | undefined;
  }

  get<T>(key: string): T {
    if (!this.#data.has(key)) throw new Error(`Missing context key: ${key}`);
    return this.#data.get(key) as T;
  }

  delete(key: string): void {
    this.#data.delete(key);
  }

  toJSON(): Dict {
    const out: Dict = Object.create(null);
    for (const [k, v] of this.#data) out[k] = v;
    return out;
  }
}
