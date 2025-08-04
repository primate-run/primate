import error_message from "#error-message";
import type Infer from "#Infer";
import Type from "#Type";
import ValidationError from "#ValidationError";
import type ValidationOptions from "#ValidationOptions";
import type AbstractorController from "@rcompat/type/AbstractConstructor";

export default class BuiltinType<StaticType, Name extends string>
  extends Type<StaticType, Name> {
  #name: string;
  #type: AbstractorController;

  constructor(name: string, type: AbstractorController) {
    super();
    this.#name = name;
    this.#type = type;
  }

  get name() {
    return this.#name;
  }

  validate(x: unknown, options: ValidationOptions = {}): Infer<this> {
    if (!(x instanceof this.#type)) {
      throw new ValidationError(error_message(this.#name, x, options));
    }

    return x as never;
  }
}
