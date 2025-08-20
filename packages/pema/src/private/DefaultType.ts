import type Infer from "#Infer";
import type Parsed from "#Parsed";
import type ParseOptions from "#ParseOptions";
import VirtualType from "#VirtualType";
import type UnknownFunction from "@rcompat/type/UnknownFunction";

function isDefaultFunction(x: unknown): x is UnknownFunction {
  return typeof x === "function";
};

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
    return "default";
  }

  get schema() {
    return this.#schema;
  }

  get input(): Infer<S> | undefined {
    return undefined;
  }

  parse(x: unknown, options: ParseOptions = {}): Infer<this> {
    let $x = x;
    // default fallback
    if ($x === undefined) {
      $x = isDefaultFunction(this.#default) ? this.#default() : this.#default;
    }

    return this.#schema.parse($x, options);
  }
}
