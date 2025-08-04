import DefaultType from "#DefaultType";
import error_message from "#error-message";
import GenericType from "#GenericType";
import type Infer from "#Infer";
import ValidationError from "#ValidationError";
import type ValidationOptions from "#ValidationOptions";
import type AbstractConstructor from "@rcompat/type/AbstractConstructor";

export default class ConstructorType<C extends AbstractConstructor>
  extends GenericType<C, InstanceType<C>, "InstanceType"> {
  #type: C;

  constructor(t: C) {
    super();
    this.#type = t;
  }

  get name() {
    return "constructor";
  }

  default(value: (() => InstanceType<C>) | InstanceType<C>) {
    return new DefaultType(this, value);
  }

  validate(x: unknown, options: ValidationOptions = {}): Infer<this> {
    if (!(x instanceof this.#type)) {
      throw new ValidationError(error_message(this.name, x, options));
    }

    return x as never;
  }
}
