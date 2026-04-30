import type Infer from "#Infer";
import type Parsed from "#Parsed";
import type ParseOptions from "#ParseOptions";
import resolve from "#resolve";
import VirtualType from "#VirtualType";
import is from "@rcompat/is";

export default class DefaultType<
  S extends Parsed<unknown>,
  D extends Infer<S>,
> extends VirtualType<S, Infer<S>, "DefaultType"> {
  #schema: S;
  #default: (() => D) | D;

  constructor(s: S, d: (() => D) | D) {
    super();
    this.#schema = s;
    this.#default = d;
  }

  get name() {
    return "default" as const;
  }

  get schema() {
    return this.#schema;
  }

  get input(): Infer<S> | undefined {
    return undefined;
  }

  parse(u: unknown, options: ParseOptions = {}): Infer<this> {
    let x = resolve(u);
    // default fallback
    if (is.undefined(x)) {
      x = is.function(this.#default) ? this.#default() : this.#default;
    }

    return this.#schema.parse(x, options);
  }

  toJSON() {
    return { type: this.name, of: this.#schema.toJSON() };
  }
}
