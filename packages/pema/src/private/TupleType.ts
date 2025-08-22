import error from "#error";
import GenericType from "#GenericType";
import schema from "#index";
import type Infer from "#Infer";
import type InferSchema from "#InferSchema";
import isParsedType from "#is-parsed-type";
import OptionalType from "#OptionalType";
import ParseError from "#ParseError";
import type ParseOptions from "#ParseOptions";
import next from "#path/next";
import type Schema from "#Schema";
import type OptionalTrait from "#trait/Optional";

type InferTuple<T extends Schema[]> = {
  [K in keyof T]:
  T[K] extends Schema
  ? InferSchema<T[K]>
  : "tuple-never"
};

export default class TupleType<T extends Schema[]>
  extends GenericType<T, InferTuple<T>, "TupleType">
  implements OptionalTrait {
  #members: T;

  constructor(members: T) {
    super();
    this.#members = members;
  }

  get name() {
    return "tuple";
  }

  optional() {
    return new OptionalType(this);
  }

  parse(x: unknown, options: ParseOptions = {}): Infer<this> {
    if (!(!!x && Array.isArray(x))) {
      throw new ParseError(error("array", x, options));
    }

    this.#members.forEach((v, i) => {
      const validator = isParsedType(v) ? v : schema(v);
      validator.parse(x[i], next(i, options));
    });

    (x as unknown[]).forEach((v, i) => {
      const member = this.#members[i];
      const validator = isParsedType(member) ? member : schema(member);
      validator.parse(v, next(i, options));
    });

    return x as never;
  }
}
