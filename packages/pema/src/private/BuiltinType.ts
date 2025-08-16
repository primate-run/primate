import CoercedType from "#CoercedType";
import CoerceKey from "#CoerceKey";
import error from "#error";
import type Infer from "#Infer";
import ParseError from "#ParseError";
import type ParseOptions from "#ParseOptions";
import Type from "#Type";
import type AbstractNewable from "@rcompat/type/AbstractNewable";

export default class BuiltinType<StaticType, Name extends string>
  extends Type<StaticType, Name> {
  #name: string;
  #type: AbstractNewable;

  constructor(name: string, type: AbstractNewable) {
    super();
    this.#name = name;
    this.#type = type;
  }

  get name() {
    return this.#name;
  }

  get coerce() {
    return new CoercedType(this);
  }

  parse(x: unknown, options: ParseOptions = {}): Infer<this> {
    const $x = options.coerce === true ? this[CoerceKey](x) : x;

    if (!($x instanceof this.#type)) {
      throw new ParseError(error(this.name, $x, options));
    }

    return $x as never;
  }
}
