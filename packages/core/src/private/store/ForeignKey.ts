import type { AllowedPKType } from "#store/PrimaryKey";
import type { OptionalType } from "pema";

export type AllowedFKType = AllowedPKType | OptionalType<AllowedPKType>;

export default class ForeignKey<T extends AllowedFKType> {
  #type: T;

  constructor(type: T) {
    this.#type = type;
  }

  static new<T extends AllowedFKType>(type: T) {
    return new ForeignKey(type);
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
