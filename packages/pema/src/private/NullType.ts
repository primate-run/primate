import error from "#error";
import type Infer from "#Infer";
import ParseError from "#ParseError";
import type ParseOptions from "#ParseOptions";
import PrimitiveType from "#PrimitiveType";

export default class NullType extends PrimitiveType<null, "NullType"> {
  constructor() {
    super("null");
  }

  parse(x: unknown, options: ParseOptions = {}): Infer<this> {
    if (x !== null) {
      throw new ParseError(error(this.name, x, options));
    }

    return x as never;
  }
}
