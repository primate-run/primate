import error from "#error";
import expected from "#expected";
import GenericType from "#GenericType";
import type Infer from "#Infer";
import ValidationError from "#ValidationError";
import type ValidationOptions from "#ValidationOptions";

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
    return "literal";
  }

  validate(x: unknown, options: ValidationOptions = {}): Infer<this> {
    if (x !== this.#literal) {
      throw new ValidationError(error(expected(`literal '${this.#literal}'`, x),
        options));
    }
    return x as never;
  }
}
