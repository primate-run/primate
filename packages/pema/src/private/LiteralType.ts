import error from "#error";
import GenericType from "#GenericType";
import type Infer from "#Infer";
import ParseError from "#ParseError";
import type ParseOptions from "#ParseOptions";

type Literal = string;
type InferLiteral<T extends Literal> = T;

export default class LiteralType<T extends Literal> extends
  GenericType<T, InferLiteral<T>, "LiteralType"> {
  #literal: T;

  constructor(literal: T) {
    super();
    this.#literal = literal;
  }

  get name() {
    return `literal '${this.#literal}'`;
  }

  parse(x: unknown, options: ParseOptions = {}): Infer<this> {
    if (x !== this.#literal) {
      throw new ParseError(error(this.name, x, options));
    }
    return x as never;
  }
}
