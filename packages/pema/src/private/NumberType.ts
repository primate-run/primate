import CoerceKey from "#CoerceKey";
import type FloatDataType from "#FloatDataType";
import NumericType from "#NumericType";
import type Storeable from "#Storeable";
import coerce from "#coerce/int";

export default class NumberType<T extends FloatDataType = "f64">
  extends NumericType<T, number, "NumberType">
  implements Storeable<T> {
  [CoerceKey] = coerce;

  get name() {
    return "number";
  }
}
