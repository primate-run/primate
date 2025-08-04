import error from "#error";
import type Infer from "#Infer";
import PrimitiveType from "#PrimitiveType";
import ValidationError from "#ValidationError";
import type ValidationOptions from "#ValidationOptions";

export default class NullType extends PrimitiveType<null, "NullType"> {
  constructor() {
    super("null");
  }

  validate(x: unknown, options: ValidationOptions = {}): Infer<this> {
    if (x !== null) {
      throw new ValidationError(error(this.name, x, options));
    }

    return x as never;
  }
}
