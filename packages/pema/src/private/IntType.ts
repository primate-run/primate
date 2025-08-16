import coerce from "#coerce/int";
import CoerceKey from "#CoerceKey";
import type IntDataType from "#IntDataType";
import PrimitiveType from "#PrimitiveType";
import type Storeable from "#Storeable";
import type Validator from "#Validator";
import integer from "#validator/integer";
import range from "#validator/range";
import values from "#validator/values";

export default class IntType<T extends IntDataType = "i32">
  extends PrimitiveType<number, "IntType">
  implements Storeable<T> {
  #datatype: T;
  [CoerceKey] = coerce;

  constructor(datatype: T, validators: Validator<number>[] = []) {
    super("number", [integer, ...validators]);
    this.#datatype = datatype;
  }

  get datatype() {
    return this.#datatype;
  }

  values(anyof: Record<string, number>) {
    return new IntType(this.#datatype, [...this.validators, values(anyof)]);
  }

  range(from: number, to: number) {
    return new IntType(this.#datatype, [...this.validators, range(from, to)]);
  }
}
