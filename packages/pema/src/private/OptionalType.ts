import type Infer from "#Infer";
import type Parsed from "#Parsed";
import type ParseOptions from "#ParseOptions";
import resolve from "#resolve";
import VirtualType from "#VirtualType";
import is from "@rcompat/is";

export default class OptionalType<S extends Parsed<unknown>>
  extends VirtualType<S | undefined, Infer<S> | undefined, "OptionalType"> {
  #schema: S;

  constructor(s: S) {
    super();
    this.#schema = s;
  }

  get name() {
    return "optional" as const;
  }

  get schema() {
    return this.#schema;
  }

  get nullable() {
    return true;
  }

  parse(u: unknown, options: ParseOptions = {}): Infer<this> {
    const x = resolve(u);

    // optional
    if (is.undefined(x)) return undefined as Infer<this>;

    return this.#schema.parse(x, options) as Infer<this>;
  }

  toJSON() {
    return {
      type: this.name,
      of: this.schema.toJSON(),
    };
  }
}
