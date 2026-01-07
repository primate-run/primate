import type BigUintDataType from "#BigUintDataType";
import coerce from "#coerce/bigint";
import CoerceKey from "#CoerceKey";
import NumericType from "#NumericType";
import type Storable from "#Storable";

export default class BigUintType<T extends BigUintDataType = "u64">
  extends NumericType<T, bigint, "BigUintType">
  implements Storable<T> {
  [CoerceKey] = coerce;

  get name() {
    return "bigint";
  }
}
