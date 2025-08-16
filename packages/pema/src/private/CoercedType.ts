import type Infer from "#Infer";
import type Parsed from "#Parsed";
import type ParseOptions from "#ParseOptions";
import VirtualType from "#VirtualType";

export default class CoercedType<
  S extends Parsed<unknown>,
> extends VirtualType<S, Infer<S>, "CoercedType"> {
  #schema: S;

  constructor(s: S) {
    super();
    this.#schema = s;
  }

  get name() {
    return "coerced-type";
  }

  get schema() {
    return this.#schema;
  }

  parse(x: unknown, options: ParseOptions = {}): Infer<this> {
    return this.#schema.parse(x, { ...options, coerce: true });
  }
}
