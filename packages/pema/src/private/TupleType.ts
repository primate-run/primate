import fail from "#fail";
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
    if (!Array.isArray(x)) throw fail("array", x, options);

    const items = this.#items;
    const len = items.length;

    // validate each expected item
    for (let i = 0; i < len; i++) items[i].parse(x[i], next(i, options));

    // reject extra items
    if (x.length > len) throw fail("undefined", x[len], next(len, options));

    return x as never;
  }

  toJSON() {
    return {
      type: this.name,
      of: this.#items.map(i => i.toJSON()),
    };
  }
}
