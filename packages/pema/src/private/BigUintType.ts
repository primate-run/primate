import type BigUintDataType from "#BigUintDataType";
import coerce from "#coerce/bigint";
import CoerceKey from "#CoerceKey";
import NumericType from "#NumericType";
import type Storeable from "#Storeable";

export default class BigUintType<T extends BigUintDataType = "u64">
  extends NumericType<T, bigint, "BigUintType">
  implements Storeable<T> {
  [CoerceKey] = coerce;

  get name() {
    return "bigint";
  }
}
