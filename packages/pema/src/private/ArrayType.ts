import expected from "#expected";
import GenericType from "#GenericType";
import type Infer from "#Infer";
import OptionalType from "#OptionalType";
import type Validated from "#Validated";

const member_error = (i: unknown, key?: string) => {
  return key === undefined
    ? `[${i}]`
    : `${key}[${i}]`;
};

const error = (message: string, key?: string) => {
  return key === undefined
    ? message
    : `${key}: ${message}`;
};

const is = <T>(x: unknown, validator: (t: unknown) => boolean): x is T => validator(x);

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

  validate(x: unknown, key?: string): Infer<this> {
    if (!is<T[]>(x, _ => !!x && Array.isArray(x))) {
      throw new Error(error(expected("array", x), key));
    }

    let last = 0;
    x.forEach((v, i) => {
      // sparse array check
      if (i > last) {
        throw new Error(error(expected(this.#subtype.name, undefined), `[${last}]`));
      }
      const validator = this.#subtype;
      validator.validate(v, `${member_error(i, key)}` as string);
      last++;
    });

    // sparse array with end slots
    if (x.length > last) {
      throw new Error(error(expected(this.#subtype.name, undefined), `[${last}]`));
    }

    return x as never;
  }
}
