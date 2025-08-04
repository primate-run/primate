import error from "#error";
import type Infer from "#Infer";
import Type from "#Type";
import ValidationError from "#ValidationError";
import type ValidationOptions from "#ValidationOptions";
import type Validator from "#Validator";

export default class PrimitiveType<StaticType, Name extends string>
  extends Type<StaticType, Name> {
  #name: string;
  #validators: Validator<StaticType>[];

  constructor(name: string, validators: Validator<StaticType>[] = []) {
    super();
    this.#name = name;
    this.#validators = validators;
  }

  get name() {
    return this.#name;
  }

  get validators() {
    return this.#validators;
  }

  validate(x: unknown, options: ValidationOptions = {}): Infer<this> {
    if (typeof x !== this.name) {
      throw new ValidationError(error(this.name, x, options));
    }

    this.#validators.forEach(validator => validator(x as StaticType));

    return x as never;
  }
}
