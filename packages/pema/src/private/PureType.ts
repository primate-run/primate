import type Infer from "#Infer";
import OptionalType from "#OptionalType";
import Parsed from "#Parsed";
import type OptionalTrait from "#trait/Optional";
import type Printable from "@rcompat/type/Printable";

export default class PureType<Type, Name extends string = "PureType">
  extends Parsed<Type>
  implements Printable, OptionalTrait {

  get name() {
    return "pure";
  }

  get Name() {
    return undefined as unknown as Name;
  }

  optional() {
    return new OptionalType(this);
  }

  parse(x: unknown): Infer<this> {
    // no parsing of static types
    return x as Infer<this>;
  }

  toJSON() {
    return { type: "pure" as const };
  }
}
