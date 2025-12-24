import CoerceKey from "#CoerceKey";
import error from "#error";
import type Infer from "#Infer";
import ParseError from "#ParseError";
import type ParseOptions from "#ParseOptions";
import Type from "#Type";
import type { AbstractNewable, Newable } from "@rcompat/type";

export default abstract class BuiltinType<StaticType, Name extends string>
  extends Type<StaticType, Name> {
  #options: ParseOptions;

  abstract get Type(): AbstractNewable;

  constructor(options: ParseOptions = {}) {
    super();
    this.#options = options;
  }

  #derive(next: ParseOptions): this {
    const Constructor = this.constructor as Newable<this>;
    return new Constructor({ ...this.#options, ...next });
  }

  get coerce() {
    return this.#derive({ coerce: true });
  }

  parse(x: unknown, options: ParseOptions = {}): Infer<this> {
    const $options = { ...this.#options, ...options };
    const $x = $options.coerce === true ? this[CoerceKey](x) : x;

    if (!($x instanceof this.Type)) {
      throw new ParseError(error(this.name, $x, $options));
    }

    return $x as never;
  }
}
