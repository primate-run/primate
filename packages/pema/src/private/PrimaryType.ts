import error from "#error";
import type Infer from "#Infer";
import ParseError from "#ParseError";
import type ParseOptions from "#ParseOptions";
import PrimitiveType from "#PrimitiveType";
import type Storeable from "#Storeable";

export default class PrimaryType
  extends PrimitiveType<string | undefined, "PrimaryType">
  implements Storeable<"primary"> {

  get name() {
    return "primary";
  }

  get datatype() {
    return "primary" as const;
  }

  parse(x: unknown, options: ParseOptions = {}): Infer<this> {
    // the primary type is an optional ype
    if (x === undefined) {
      return x as Infer<this>;
    }

    if (typeof x !== "string") {
      throw new ParseError(error(this.name, x, options));
    }

    return x as never;
  }
}
