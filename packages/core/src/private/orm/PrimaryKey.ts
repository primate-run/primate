import log from "#log";
import type { DataKey, Storable } from "pema";

export type Options = {
  generate?: boolean;
};

const RECOMMENDED_TYPES = new Set([
  "string", "u16", "u32", "u64", "u128",
]);

export default class PrimaryKey<T extends Storable<DataKey>> {
  #type: T;
  #generate: boolean;

  constructor(type: T, options?: Options) {
    this.#type = type;
    this.#generate = options?.generate ?? true;

    const datatype = this.#type.datatype;
    if (!RECOMMENDED_TYPES.has(datatype)) {
      log.warn("key.primary: {0} is unusual for a primary key", datatype);
    }
  }

  get type() {
    return this.#type;
  }

  get datatype() {
    return this.#type.datatype;
  }

  get name() {
    return this.#type.name;
  }

  get nullable() {
    return false;
  }

  get generate() {
    return this.#generate;
  }

  parse(value: unknown) {
    return this.#type.parse(value);
  }
}
