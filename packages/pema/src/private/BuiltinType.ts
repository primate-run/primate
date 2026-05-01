import CoerceKey from "#CoerceKey";
import E from "#errors";
import type Infer from "#Infer";
import Loose from "#Loose";
import type ParseOptions from "#ParseOptions";
import resolve from "#resolve";
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

  parse(u: unknown, options: ParseOptions = {}): Infer<this> {
    const x = resolve(u);
    const $options = { ...this.#options, ...options };
    const loose = this[Loose] ?? $options[Loose] ?? false;
    const $x = loose ? this[CoerceKey](x) : x;

    if (!($x instanceof this.Type)) throw E.invalid_type($x, this.name, $options);

    return $x as never;
  }
}
