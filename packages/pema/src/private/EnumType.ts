import DefaultType from "#DefaultType";
import fail from "#fail";
import GenericType from "#GenericType";
import type Infer from "#Infer";
import OptionalType from "#OptionalType";
import type ParseOptions from "#ParseOptions";
import type OptionalTrait from "#trait/Optional";

type Literal = string;

export default class EnumType<T extends readonly Literal[]>
  extends GenericType<T, T[number], "EnumType">
  implements OptionalTrait {
  #values: T;

  constructor(values: T) {
    super();
    this.#values = values;
  }

  get name() {
    return this.#values.map(v => `"${v}"`).join(" | ");
  }

  optional() {
    return new OptionalType(this);
  }

  default<D extends T[number]>(value: (() => D) | D) {
    return new DefaultType<EnumType<T>, D>(this, value);
  }

  parse(x: unknown, options: ParseOptions = {}): Infer<this> {
    if (typeof x !== "string" || !this.#values.includes(x as T[number])) {
      throw fail(this.name, x, options);
    }
    return x as never;
  }

  toJSON() {
    return { type: "enum" as const, values: [...this.#values] };
  }
}
