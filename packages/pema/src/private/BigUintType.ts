import type BigUintDataType from "#BigUintDataType";
import coerce from "#coerce/bigint";
import CoerceKey from "#CoerceKey";
import PrimitiveType from "#PrimitiveType";
import type Storeable from "#Storeable";
import type Validator from "#Validator";
import range from "#validator/range";
import values from "#validator/values";

export default class BigUintType<T extends BigUintDataType = "u64">
  extends PrimitiveType<bigint, "BigUintType">
  implements Storeable<T> {
  [CoerceKey] = coerce;
  #datatype: T;

  constructor(datatype: T, validators: Validator<bigint>[] = []) {
    super("bigint", validators);
    this.#datatype = datatype;
  }

  get datatype() {
    return this.#datatype;
  }

  values(anyof: Record<string, bigint>) {
    return new BigUintType(this.#datatype, [...this.validators, values(anyof)]);
  }

  range(from: bigint, to: bigint) {
    return new BigUintType(this.#datatype, [...this.validators, range(from, to)]);
  }
}
