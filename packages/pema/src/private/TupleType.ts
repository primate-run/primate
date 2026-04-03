import E from "#errors";
import GenericType from "#GenericType";
import type Infer from "#Infer";
import type NormalizeSchema from "#NormalizeSchema";
import OptionalType from "#OptionalType";
import type Parsed from "#Parsed";
import type ParseOptions from "#ParseOptions";
import next from "#path/next";
import type Schema from "#Schema";
import type OptionalTrait from "#trait/Optional";

type InferTuple<T extends Schema[]> = {
  [K in keyof T]:
  T[K] extends Schema
  ? NormalizeSchema<T[K]>["infer"]
  : "tuple-never"
};

export default class TupleType<T extends Parsed<unknown>[]>
  extends GenericType<T, InferTuple<T>, "TupleType">
  implements OptionalTrait {
  #items: T;

  constructor(items: T) {
    super();
    this.#items = items;
  }

  get name() {
    return "tuple" as const;
  }

  optional() {
    return new OptionalType(this);
  }

  parse(x: unknown, options: ParseOptions = {}): Infer<this> {
    if (!Array.isArray(x)) throw E.invalid_type(x, "array", options);

    const items = this.#items;
    const n = items.length;
    const out = new Array(n) as InferTuple<T>;

    // validate each expected item
    for (let i = 0; i < n; i++) {
      out[i] = items[i].parse(x[i], next(i, options)) as InferTuple<T>[typeof i];
    }

    // reject extra items
    if (x.length > n) throw E.invalid_type(x[n], "undefined", next(n, options));

    return out as never;
  }

  toJSON() {
    return {
      type: this.name,
      of: this.#items.map(i => i.toJSON()),
    };
  }
}
