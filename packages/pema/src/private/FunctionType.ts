import fail from "#fail";
import GenericType from "#GenericType";
import type Infer from "#Infer";
import OptionalType from "#OptionalType";
import type ParseOptions from "#ParseOptions";
import type OptionalTrait from "#trait/Optional";
import type { UnknownFunction } from "@rcompat/type";

export default class FunctionType
  extends GenericType<UnknownFunction, UnknownFunction, "FunctionType">
  implements OptionalTrait {

  get name() {
    return "function" as const;
  }

  optional() {
    return new OptionalType(this);
  }

  parse(x: unknown, options: ParseOptions = {}): Infer<this> {
    if (typeof x !== "function") throw fail(this.name, x, options);
    return x as Infer<this>;
  }

  toJSON() {
    return { type: this.name };
  }
}
