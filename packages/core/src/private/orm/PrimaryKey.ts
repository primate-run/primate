import log from "#log";
import type { DataKey, Storable } from "pema";

const RECOMMENDED_TYPES = new Set([
  "string", "u16", "u32", "u64", "u128",
]);

export default class PrimaryKey<T extends Storable<DataKey>> {
  #type: T;

  constructor(type: T) {
    this.#type = type;

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
}
