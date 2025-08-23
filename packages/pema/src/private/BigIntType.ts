import type BigIntDataType from "#BigIntDataType";
import coerce from "#coerce/bigint";
import CoerceKey from "#CoerceKey";
import NumericType from "#NumericType";
import type Storeable from "#Storeable";

export default class BigIntType<T extends BigIntDataType = "i64">
  extends NumericType<T, bigint, "BigIntType">
  implements Storeable<T> {
  [CoerceKey] = coerce;

  get name() {
    return "bigint";
  }
}
