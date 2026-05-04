import type BigIntDataType from "#BigIntDataType";
import coerce from "#coerce/bigint";
import CoerceKey from "#CoerceKey";
import NumericType from "#NumericType";
import type Storable from "#Storable";

export default class BigIntType<
  T extends BigIntDataType = "i64",
  L extends boolean | undefined = undefined,
> extends NumericType<T, bigint, "BigIntType", L>
  implements Storable<T> {
  [CoerceKey] = coerce;

  get name() {
    return "bigint";
  }
}
