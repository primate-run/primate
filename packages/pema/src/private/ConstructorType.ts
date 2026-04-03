import DefaultType from "#DefaultType";
import E from "#errors";
import GenericType from "#GenericType";
import type Infer from "#Infer";
import OptionalType from "#OptionalType";
import type ParseOptions from "#ParseOptions";
import type DefaultTrait from "#trait/Default";
import type OptionalTrait from "#trait/Optional";
import type { AbstractNewable } from "@rcompat/type";

export default class ConstructorType<C extends AbstractNewable>
  extends GenericType<C, InstanceType<C>, "InstanceType">
  implements OptionalTrait, DefaultTrait<InstanceType<C>> {
  #type: C;

  constructor(t: C) {
    super();
    this.#type = t;
  }

  get name() {
    return "constructor";
  }

  optional() {
    return new OptionalType(this);
  }

  default(value: (() => InstanceType<C>) | InstanceType<C>) {
    return new DefaultType(this, value);
  }

  parse(x: unknown, options: ParseOptions = {}): Infer<this> {
    if (!(x instanceof this.#type)) throw E.invalid_type(x, this.name, options);

    return x as never;
  }

  toJSON() {
    return {
      type: "newable" as const,
      of: this.#type.name,
    };
  }
}
