import DefaultType from "#DefaultType";
import error from "#error";
import GenericType from "#GenericType";
import schema from "#index";
import type Infer from "#Infer";
import type InferSchema from "#InferSchema";
import isParsedType from "#is-parsed-type";
import OptionalType from "#OptionalType";
import type Parsed from "#Parsed";
import ParseError from "#ParseError";
import type ParseOptions from "#ParseOptions";
import type Schema from "#Schema";
import type DefaultTrait from "#trait/Default";
import type OptionalTrait from "#trait/Optional";
import assert from "@rcompat/assert";
import type TupleToUnion from "@rcompat/type/TupleToUnion";

type InferUnion<T extends Schema[]> = TupleToUnion<{
  [K in keyof T]:
  T[K] extends Schema
  ? InferSchema<T[K]>
  : "union-never"
}>;

const print = (type: unknown) => {
  const parsed = isParsedType(type);

  if (parsed) {
    return type.name;
  }

  const type_of = typeof type;

  if (type_of === "string") {
    return `"${type}"`;
  }

  if (type_of === "bigint") {
    return `${type as bigint}n`;
  }

  if (type_of === "object") {
    return `{ ${Object.entries(type as object)
      .map(([name, subtype]): string => `${name}: ${print(subtype)}`)
      .join(", ")} }`;
  }

  return type;
};

const union_error = (types: Schema[]) =>
  `\`${types.map(t => isParsedType(t) ? t.name : print(t)).join(" | ")}\``;

export default class UnionType<T extends Parsed<unknown>[]>
  extends GenericType<T, InferUnion<T>, "UnionType">
  implements OptionalTrait, DefaultTrait<InferUnion<T>> {
  #of: T;

  constructor(of: T) {
    assert(of.length > 1, "union type must have at least two members");
    super();
    this.#of = of;
  }

  get name() {
    return "union" as const;
  }

  get schema() {
    return this.#of;
  }

  optional() {
    return new OptionalType(this);
  }

  default(value: (() => InferUnion<T>) | InferUnion<T>) {
    return new DefaultType(this, value);
  }

  parse(x: unknown, options: ParseOptions = {}): Infer<this> {
    // union parses when any of its members parses
    const parsed = this.#of.map(type => {
      const validator = isParsedType(type) ? type : schema(type);
      try {
        validator.parse(x, options);
        return true;
      } catch (e) {
        return e as ParseError;
      }
    });
    if (!parsed.some(r => r === true)) {
      throw new ParseError(error(union_error(this.#of), x, options));
    }

    return x as never;
  }

  toJSON() {
    return { type: this.name, of: this.#of.map(t => t.toJSON()) };
  }
}
