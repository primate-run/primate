import GenericType from "#GenericType";
import type Infer from "#Infer";
import type InferStore from "#InferStore";
import ParsedKey from "#ParsedKey";
import type ParseOptions from "#ParseOptions";
import PartialType from "#PartialType";
import join from "#path/join";
import type StoreSchema from "#StoreSchema";

export default class StoreType<T extends StoreSchema>
  extends GenericType<T, InferStore<T>, "StoreType"> {
  #spec: T;

  constructor(spec: T) {
    super();
    this.#spec = spec;
  }

  get name() {
    return "store";
  }

  get schema() {
    return this.#spec;
  }

  partial() {
    return new PartialType(this.#spec);
  }

  parse(x: unknown, options: ParseOptions = {}): Infer<this> {
    const spec = this.#spec;

    if (typeof x !== "object" || x === null) {
      throw new Error("Expected object");
    }
    const result: any = {};
    for (const k in spec) {
      const r = spec[k].parse((x as any)[k], {
        ...options, [ParsedKey]: join(options[ParsedKey] ?? "", String(k)),
      });
      // exclude undefined (optionals)
      if (r !== undefined) {
        result[k] = r;
      }
    }

    return x as never;
  }
}
