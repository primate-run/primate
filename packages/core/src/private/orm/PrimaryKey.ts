import E from "#db/error";
import type { Storable } from "pema";

export type Options = {
  generate?: boolean;
};

const ALLOWED_TYPES = new Set([
  "uuid", "uuid_v4", "uuid_v7",
  "u8", "u16", "u32", "u64", "u128",
]);

export type AllowedPKType =
  | Storable<"uuid">
  | Storable<"uuid_v4">
  | Storable<"uuid_v7">
  | Storable<"u8">
  | Storable<"u16">
  | Storable<"u32">
  | Storable<"u64">
  | Storable<"u128">
  ;

export default class PrimaryKey<T extends AllowedPKType> {
  #type: T;
  #generate: boolean;

  constructor(type: T, options?: Options) {
    this.#type = type;
    this.#generate = options?.generate ?? true;

    const datatype = this.#type.datatype;
    if (!ALLOWED_TYPES.has(datatype)) throw E.pk_invalid_type(datatype);
  }

  static new<T extends AllowedPKType>(type: T, options?: Options) {
    return new PrimaryKey(type, options);
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
