import fail from "#fail";
import GenericType from "#GenericType";
import type Infer from "#Infer";
import type ParseOptions from "#ParseOptions";

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

  parse(x: unknown, options: ParseOptions = {}): Infer<this> {
    if (x !== this.#literal) throw fail(this.name, x, options);

    return x as never;
  }

  toJSON() {
    return {
      type: "literal" as const,
      value: this.#literal,
    };
  }
}
