import GenericType from "#GenericType";
import type Infer from "#Infer";
import OptionalType from "#OptionalType";
import type ParseOptions from "#ParseOptions";
import type OptionalTrait from "#trait/Optional";
import type { UnknownFunction } from "@rcompat/type";
import E from "#errors";

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
    if (typeof x !== "function") throw E.invalid_type(x, this.name, options);
    return x as Infer<this>;
  }

  toJSON() {
    return { type: this.name };
  }
}
