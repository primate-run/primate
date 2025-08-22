import type Infer from "#Infer";
import type Parsed from "#Parsed";
import type ParseOptions from "#ParseOptions";
import VirtualType from "#VirtualType";

export default class OptionalType<S extends Parsed<unknown>>
  extends VirtualType<S | undefined, Infer<S> | undefined, "OptionalType"> {
  #schema: S;

  constructor(s: S) {
    super();
    this.#schema = s;
  }

  get name() {
    return "optional";
  }

  get schema() {
    return this.#schema;
  }

  get nullable() {
    return true;
  }

  parse(x: unknown, options: ParseOptions = {}): Infer<this> {
    const s = this.#schema;

    // optional
    if (x === undefined) {
      return undefined as Infer<this>;
    }

    return s.parse(x, options) as Infer<this>;
  }
}
