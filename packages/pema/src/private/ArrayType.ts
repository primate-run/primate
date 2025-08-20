import error from "#error";
import GenericType from "#GenericType";
import type Infer from "#Infer";
import member_error from "#member-error";
import OptionalType from "#OptionalType";
import type Parsed from "#Parsed";
import ParseError from "#ParseError";
import type ParseOptions from "#ParseOptions";
import PrimitiveType from "#PrimitiveType";
import SchemaError from "#SchemaError";
import type OptionalTrait from "#trait/Optional";
import type Validator from "#Validator";
import unique from "#validator/unique";
import type Primitive from "@rcompat/type/Primitive";

function isPrimitive(x: Parsed<unknown>): x is PrimitiveType<unknown, string> {
  return x instanceof PrimitiveType;
}

const is = <T>(x: unknown, validator: (t: unknown) => boolean): x is T =>
  validator(x);

export default class ArrayType<T extends Parsed<unknown>>
  extends GenericType<T, Infer<T>[], "ArrayType">
  implements OptionalTrait {
  #subtype: T;
  #validators: Validator<Array<Infer<T>>>[];

  constructor(subtype: T, validators: Validator<Array<Infer<T>>>[] = []) {
    super();
    this.#subtype = subtype;
    this.#validators = validators;
  }

  get name() {
    return "array";
  }

  /**
  * Value is optional.
  *
  * @returns OptionalType<ArrayType<T>>
  */
  optional() {
    return new OptionalType(this);
  }

  /**
   * Member values are unique — only for primitive subtypes.
   *
   * @throws `SchemaError` if the subtype is not a primitive.
   * @returns ArrayType<T>
   */
  unique(
    this: Infer<T> extends Primitive ? ArrayType<T> : never,
  ): ArrayType<T> {
    if (!isPrimitive(this.#subtype)) {
      throw new SchemaError(
        "array.unique: subtype {0} must be primitive", this.#subtype.name,
      );
    }
    return new ArrayType<T>(this.#subtype, [...this.#validators, unique]);
  }

  parse(x: unknown, options: ParseOptions = {}): Infer<this> {
    if (!is<T[]>(x, _ => !!x && Array.isArray(x))) {
      throw new ParseError(error("array", x, options));
    }

    let last = 0;
    x.forEach((v, i) => {
      // sparse array check
      if (i > last) {
        throw new ParseError([{
          ...error(this.#subtype.name, undefined, options)[0],
          key: `${last}`,
        }]);
      }
      const validator = this.#subtype;
      validator.parse(v, member_error(i, options));
      last++;
    });

    // sparse array with end slots
    if (x.length > last) {
      throw new ParseError([{
        ...error(this.#subtype.name, undefined, options)[0],
        key: `${last}`,
      }]);
    }

    this.#validators.forEach(v => v(x));

    return x as never;
  }
}
