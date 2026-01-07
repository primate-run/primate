import coerce from "#coerce/int";
import CoerceKey from "#CoerceKey";
import type IntDataType from "#IntDataType";
import NumericType from "#NumericType";
import type ParseOptions from "#ParseOptions";
import type Storable from "#Storable";
import integer from "#validator/integer";

export default class IntType<T extends IntDataType>
  extends NumericType<T, number, "IntType">
  implements Storable<T> {
  [CoerceKey] = coerce;

  get name() {
    return "number";
  }

  parse(x: unknown, options: ParseOptions<number> = {}) {
    return super.parse(x, {
      ...options,
      validators: [integer],
    });
  }
}
