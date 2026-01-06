import error from "#error";
import GenericType from "#GenericType";
import type Infer from "#Infer";
import type NormalizeSchema from "#NormalizeSchema";
import OptionalType from "#OptionalType";
import type Parsed from "#Parsed";
import ParseError from "#ParseError";
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
    if (!(!!x && Array.isArray(x))) {
      throw new ParseError(error("array", x, options));
    }

    this.#items.forEach((v, i) => {
      v.parse(x[i], next(i, options));
    });

    x.forEach((v, i) => {
      if (i >= this.#items.length) {
        throw new ParseError(error("undefined", v, next(i, options)));
      }
    });

    return x as never;
  }

  toJSON() { return { type: this.name, of: this.#items.map(i => i.toJSON()) }; }
}
