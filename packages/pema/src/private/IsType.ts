import DefaultType from "#DefaultType";
import E from "#errors";
import type Infer from "#Infer";
import OptionalType from "#OptionalType";
import Parsed from "#Parsed";
import type ParseOptions from "#ParseOptions";
import type DefaultTrait from "#trait/Default";
import type OptionalTrait from "#trait/Optional";

export default class IsType<T> extends Parsed<T>
  implements OptionalTrait, DefaultTrait<T> {
  #predicate: (x: unknown) => x is T;

  constructor(predicate: (x: unknown) => x is T) {
    super();
    this.#predicate = predicate;
  }

  get name() {
    return "is" as const;
  }

  optional() {
    return new OptionalType(this);
  }

  default(value: (() => T) | T) {
    return new DefaultType(this, value);
  }

  parse(x: unknown, options: ParseOptions = {}): Infer<this> {
    if (!this.#predicate(x)) throw E.invalid_type(x, this.name, options);
    return x as Infer<this>;
  }

  toJSON() {
    return { type: this.name };
  }
}
