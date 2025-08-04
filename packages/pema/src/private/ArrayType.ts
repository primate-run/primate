import error from "#error";
import GenericType from "#GenericType";
import type Infer from "#Infer";
import member_error from "#member-error";
import OptionalType from "#OptionalType";
import type Validated from "#Validated";
import ValidationError from "#ValidationError";
import type ValidationOptions from "#ValidationOptions";

const is = <T>(x: unknown, validator: (t: unknown) => boolean): x is T =>
  validator(x);

export default class ArrayType<T extends Validated<unknown>> extends
  GenericType<T, Infer<T>[], "ArrayType"> {
  #subtype: T;

  constructor(subtype: T) {
    super();
    this.#subtype = subtype;
  }

  get name() {
    return "array";
  }

  /**
  * Value is optional.
  */
  optional() {
    return new OptionalType(this);
  }

  validate(x: unknown, options: ValidationOptions = {}): Infer<this> {
    if (!is<T[]>(x, _ => !!x && Array.isArray(x))) {
      throw new ValidationError(error("array", x, options));
    }

    let last = 0;
    x.forEach((v, i) => {
      // sparse array check
      if (i > last) {
        throw new ValidationError([{
          ...error(this.#subtype.name, undefined, options)[0],
          key: `${last}`,
        }]);
      }
      const validator = this.#subtype;
      validator.validate(v, member_error(i, options));
      last++;
    });

    // sparse array with end slots
    if (x.length > last) {
      throw new ValidationError([{
        ...error(this.#subtype.name, undefined, options)[0],
        key: `${last}`,
      }]);
    }

    return x as never;
  }
}
