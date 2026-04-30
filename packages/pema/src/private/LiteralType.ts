import DefaultType from "#DefaultType";
import GenericType from "#GenericType";
import type Infer from "#Infer";
import OptionalType from "#OptionalType";
import type ParseOptions from "#ParseOptions";
import E from "#errors";
import resolve from "#resolve";

type Literal = string | boolean | number;

export default class LiteralType<T extends Literal> extends
  GenericType<T, T, "LiteralType"> {
  #literal: T;

  constructor(literal: T) {
    super();
    this.#literal = literal;
  }

  static new<T extends Literal>(literal: T) {
    return new LiteralType(literal);
  }

  static get Literal(): Literal {
    return undefined as unknown as Literal;
  }

  get name() {
    return JSON.stringify(this.#literal);
  }

  optional() {
    return new OptionalType(this);
  }

  default(value: (() => T) | T) {
    return new DefaultType(this, value);
  }

  parse(u: unknown, options: ParseOptions = {}): Infer<this> {
    const x = resolve(u);

    if (x !== this.#literal) throw E.invalid_type(x, this.name, options);

    return x as never;
  }

  toJSON() {
    return {
      type: "literal" as const,
      value: this.#literal,
    };
  }
}
