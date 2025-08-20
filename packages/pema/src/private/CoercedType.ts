import DefaultType from "#DefaultType";
import type Infer from "#Infer";
import type Parsed from "#Parsed";
import type ParseOptions from "#ParseOptions";
import type DefaultTrait from "#trait/Default";
import VirtualType from "#VirtualType";

export default class CoercedType<
  T extends Parsed<unknown>,
> extends VirtualType<T, Infer<T>, "CoercedType">
  implements DefaultTrait<Infer<T>> {
  #schema: T;

  constructor(s: T) {
    super();
    this.#schema = s;
  }

  get name() {
    return "coerced-type";
  }

  get schema() {
    return this.#schema;
  }

  default(value: (() => T) | T) {
    return new DefaultType(this, value);
  }

  parse(x: unknown, options: ParseOptions = {}): Infer<this> {
    return this.#schema.parse(x, { ...options, coerce: true });
  }
}
