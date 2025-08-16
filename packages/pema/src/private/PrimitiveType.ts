import CoercedType from "#CoercedType";
import CoerceKey from "#CoerceKey";
import error from "#error";
import type Infer from "#Infer";
import ParseError from "#ParseError";
import type ParseOptions from "#ParseOptions";
import Type from "#Type";
import type Validator from "#Validator";

export default class PrimitiveType<StaticType, Name extends string>
  extends Type<StaticType, Name> {
  #name: string;
  #validators: Validator<StaticType>[];

  constructor(name: string, validators: Validator<StaticType>[] = []) {
    super();
    this.#name = name;
    this.#validators = validators;
  }

  get name() {
    return this.#name;
  }

  get validators() {
    return this.#validators;
  }

  get coerce() {
    return new CoercedType(this);
  }

  parse(x: unknown, options: ParseOptions = {}): Infer<this> {
    const $x = options.coerce === true ? this[CoerceKey](x) : x;

    if (typeof $x !== this.name) {
      throw new ParseError(error(this.name, $x, options));
    }

    this.#validators.forEach(validator => validator($x as StaticType));

    return $x as never;
  }
}
