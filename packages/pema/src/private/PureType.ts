import type Infer from "#Infer";
import Validated from "#Validated";
import type Printable from "@rcompat/type/Printable";
import OptionalType from "#OptionalType";

export default class PureType<Type, Name extends string = "PureType">
  extends Validated<Type>
  implements Printable {

  get name() {
    return "type";
  }

  get Name() {
    return undefined as unknown as Name;
  }

  /**
  * Value is optional.
  */
  optional() {
    return new OptionalType(this);
  }

  validate(x: unknown): Infer<this> {
    // no validation of static types
    return x as Infer<this>;
  }
}
