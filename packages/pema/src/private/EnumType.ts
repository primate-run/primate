import DefaultType from "#DefaultType";
import E from "#errors";
import GenericType from "#GenericType";
import type Infer from "#Infer";
import OptionalType from "#OptionalType";
import type ParseOptions from "#ParseOptions";
import resolve from "#resolve";
import type OptionalTrait from "#trait/Optional";
import is from "@rcompat/is";

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

  parse(u: unknown, options: ParseOptions = {}): Infer<this> {
    const x = resolve(u);

    if (!is.string(x) || !this.#values.includes(x as T[number])) {
      throw E.invalid_type(x, this.name, options);
    }
    return x as never;
  }

  toJSON() {
    return { type: "enum" as const, values: [...this.#values] };
  }
}
