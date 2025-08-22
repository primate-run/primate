import CoerceKey from "#CoerceKey";
import type FloatDataType from "#FloatDataType";
import PrimitiveType from "#PrimitiveType";
import type Storeable from "#Storeable";
import type Validator from "#Validator";
import numeric from "@rcompat/is/numeric";

export default class NumberType<T extends FloatDataType = "f64">
  extends PrimitiveType<number, `NumberType<'${T}'>`>
  implements Storeable<T> {
  #datatype: T;

  constructor(datatype: T = "f64" as T, validators: Validator<number>[] = []) {
    super("number", validators);
    this.#datatype = datatype;
  }

  get datatype() {
    return this.#datatype;
  }

  [CoerceKey](x: unknown) {
    if (numeric(x)) {
      return Number(x);
    }
    return x;
  }
}
