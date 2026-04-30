import type Infer from "#Infer";
import type ParseOptions from "#ParseOptions";
import PrimitiveType from "#PrimitiveType";
import E from "#errors";
import resolve from "#resolve";
import is from "@rcompat/is";

export default class NullType extends PrimitiveType<null, "NullType"> {
  get name() {
    return "null" as const;
  }

  parse(u: unknown, options: ParseOptions = {}): Infer<this> {
    const x = resolve(u);

    if (!is.null(x)) throw E.invalid_type(x, this.name, options);

    return x as never;
  }

  toJSON() {
    return {
      type: this.name,
    };
  }
}
