import type Infer from "#Infer";
import type Validated from "#Validated";
import type ValidationOptions from "#ValidationOptions";
import VirtualType from "#VirtualType";
import type UnknownFunction from "@rcompat/type/UnknownFunction";

const is_default_function = (x: unknown): x is UnknownFunction => {
  return typeof x === "function";
};

export default class DefaultType<
  S extends Validated<unknown>,
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

  validate(x: unknown, options: ValidationOptions = {}): Infer<this> {
    // default fallback
    if (x === undefined) {
      if (is_default_function(this.#default)) {
        return this.#default() as Infer<this>;
      }
      return this.#default as Infer<this>;
    }

    return this.#schema.validate(x, options) as Infer<this>;
  }
}
