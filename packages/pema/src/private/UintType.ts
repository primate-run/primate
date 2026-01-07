import coerce from "#coerce/int";
import CoerceKey from "#CoerceKey";
import NumericType from "#NumericType";
import type ParseOptions from "#ParseOptions";
import type Storable from "#Storable";
import type UintDataType from "#UintDataType";
import integer from "#validator/integer";
import port from "#validator/port";

export default class UintType<T extends UintDataType>
  extends NumericType<T, number, "UintType">
  implements Storable<T> {
  [CoerceKey] = coerce;

  get name() {
    return "number";
  }

  /**
  * Value is a non-privileged port number (1000 - 65535).
  */
  port() {
    return this.derive({ validators: [port] });
  }

  parse(x: unknown, options: ParseOptions<number> = {}) {
    return super.parse(x, {
      ...options,
      validators: [integer],
    });
  }
}
