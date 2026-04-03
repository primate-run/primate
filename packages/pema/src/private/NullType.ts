import type Infer from "#Infer";
import type ParseOptions from "#ParseOptions";
import PrimitiveType from "#PrimitiveType";
import E from "#errors";

export default class NullType extends PrimitiveType<null, "NullType"> {
  get name() {
    return "null" as const;
  }

  parse(x: unknown, options: ParseOptions = {}): Infer<this> {
    if (x !== null) throw E.invalid_type(x, this.name, options);

    return x as never;
  }

  toJSON() {
    return {
      type: this.name,
    };
  }
}
