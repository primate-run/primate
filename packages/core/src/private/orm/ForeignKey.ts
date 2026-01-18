import type { DataKey, Storable } from "pema";

export default class ForeignKey<T extends Storable<DataKey>> {
  #type: T;

  constructor(type: T) {
    this.#type = type;
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
    return this.#type.nullable;
  }

  parse(value: unknown) {
    return this.#type.parse(value);
  }
}
