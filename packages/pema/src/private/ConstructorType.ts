import DefaultType from "#DefaultType";
import GenericType from "#GenericType";
import type Infer from "#Infer";
import type AbstractConstructor from "@rcompat/type/AbstractConstructor";

const error_message = (name: string, x: unknown, key?: string) => {
  const base = `expected ${name}, got \`${x}\` (${(typeof x)})`;
  return key === undefined
    ? base
    : `${key}: ${base}`;
};

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

  validate(x: unknown, key?: string): Infer<this> {
    if (!(x instanceof this.#type)) {
      throw new Error(error_message(this.name, x, key));
    }

    return x as never;
  }
}
