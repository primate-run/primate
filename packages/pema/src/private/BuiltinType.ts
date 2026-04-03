import CoerceKey from "#CoerceKey";
import E from "#errors";
import type Infer from "#Infer";
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

  parse(x: unknown, options: ParseOptions = {}): Infer<this> {
    const $options = { ...this.#options, ...options };
    const $x = $options.coerce === true ? this[CoerceKey](x) : x;

    if (!($x instanceof this.Type)) throw E.invalid_type($x, this.name, $options);

    return $x as never;
  }
}
