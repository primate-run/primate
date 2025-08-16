import type Infer from "#Infer";
import OptionalType from "#OptionalType";
import Parsed from "#Parsed";
import type Printable from "@rcompat/type/Printable";

export default class PureType<Type, Name extends string = "PureType">
  extends Parsed<Type>
  implements Printable {

  get name() {
    return "pure-type";
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

  parse(x: unknown): Infer<this> {
    // no parsing of static types
    return x as Infer<this>;
  }
}
