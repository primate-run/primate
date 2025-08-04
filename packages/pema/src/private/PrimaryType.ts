import error from "#error";
import type Infer from "#Infer";
import PrimitiveType from "#PrimitiveType";
import type Storeable from "#Storeable";
import ValidationError from "#ValidationError";
import type ValidationOptions from "#ValidationOptions";

export default class PrimaryType
  extends PrimitiveType<string | undefined, "PrimaryType">
  implements Storeable<"primary"> {

  constructor() {
    super("primary");
  }

  get datatype() {
    return "primary" as const;
  }

  normalize(value: string) {
    return value;
  }

  validate(x: unknown, options: ValidationOptions = {}): Infer<this> {
    // the primary type is an optional ype
    if (x === undefined) {
      return x as Infer<this>;
    }

    if (typeof x !== "string") {
      throw new ValidationError(error(this.name, x, options));
    }

    return x as never;
  }
}
