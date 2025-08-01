import DefaultType from "#DefaultType";
import OptionalType from "#OptionalType";
import Validated from "#Validated";
import type Printable from "@rcompat/type/Printable";

export default abstract class Type<Type, Name extends string>
  extends Validated<Type>
  implements Printable {

  /**
  * Value is optional.
  */
  optional() {
    return new OptionalType(this);
  }

  /**
  * Use the given default if value is missing.
  */
  default<const S extends Type>(value: (() => S) | S) {
    return new DefaultType(this, value);
  }

  get Name(): Name {
    return undefined as unknown as Name;
  }
}
