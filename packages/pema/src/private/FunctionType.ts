import E from "#errors";
import GenericType from "#GenericType";
import type Infer from "#Infer";
import OptionalType from "#OptionalType";
import type ParseOptions from "#ParseOptions";
import resolve from "#resolve";
import type OptionalTrait from "#trait/Optional";
import is from "@rcompat/is";
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

  parse(u: unknown, options: ParseOptions = {}): Infer<this> {
    const x = resolve(u);

    if (!is.function(x)) throw E.invalid_type(x, this.name, options);

    return x as Infer<this>;
  }

  toJSON() {
    return { type: this.name };
  }
}
