import DefaultType from "#DefaultType";
import fail from "#fail";
import GenericType from "#GenericType";
import type Infer from "#Infer";
import type ParseOptions from "#ParseOptions";
import type DefaultTrait from "#trait/Default";
import type { AbstractNewable } from "@rcompat/type";

export default class ConstructorType<C extends AbstractNewable>
  extends GenericType<C, InstanceType<C>, "InstanceType">
  implements DefaultTrait<InstanceType<C>> {
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

  parse(x: unknown, options: ParseOptions = {}): Infer<this> {
    if (!(x instanceof this.#type)) throw fail(this.name, x, options);

    return x as never;
  }

  toJSON() {
    return {
      type: "newable" as const,
      of: this.#type.name,
    };
  }
}
