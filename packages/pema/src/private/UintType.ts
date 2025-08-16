import coerce from "#coerce/int";
import CoerceKey from "#CoerceKey";
import type DataType from "#DataType";
import PrimitiveType from "#PrimitiveType";
import type Storeable from "#Storeable";
import type UintDataType from "#UintDataType";
import type Validator from "#Validator";
import integer from "#validator/integer";
import port from "#validator/port";
import range from "#validator/range";
import values from "#validator/values";

export default class UintType<T extends UintDataType = "u32">
  extends PrimitiveType<number, "UintType">
  implements Storeable<T> {
  [CoerceKey] = coerce;
  #datatype: T;

  constructor(datatype: T, validators: Validator<DataType[T]>[] = []) {
    super("number", [integer, ...validators]);
    this.#datatype = datatype;
  }

  get datatype() {
    return this.#datatype;
  }

  values(anyof: Record<string, number>) {
    return new UintType(this.#datatype, [...this.validators, values(anyof)]);
  }

  range(from: number, to: number) {
    return new UintType(this.#datatype, [...this.validators, range(from, to)]);
  }

  /**
  * Value is a non-privileged port number (1000 - 65535).
  */
  port() {
    return new UintType(this.#datatype, [...this.validators, port]);
  }
}
