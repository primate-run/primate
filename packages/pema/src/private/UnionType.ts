import DefaultType from "#DefaultType";
import fail from "#fail";
import GenericType from "#GenericType";
import type Infer from "#Infer";
import isParsedType from "#is-parsed-type";
import type NormalizeSchema from "#NormalizeSchema";
import OptionalType from "#OptionalType";
import type Parsed from "#Parsed";
import ParseError from "#ParseError";
import type ParseOptions from "#ParseOptions";
import type Schema from "#Schema";
import type DefaultTrait from "#trait/Default";
import type OptionalTrait from "#trait/Optional";
import assert from "@rcompat/assert";
import type { TupleToUnion } from "@rcompat/type";

type InferUnion<T extends Schema[]> = TupleToUnion<{
  [K in keyof T]:
  T[K] extends Schema
  ? NormalizeSchema<T[K]>["infer"]
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
    assert.true(of.length > 1, "union type must have at least two members");
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
    for (const type of this.#of) {
      try {
        type.parse(x, options);
        return x as never;
      } catch (e) {
        if (!(e instanceof ParseError)) {
          throw e;
        }
        // continue to next
      }
    }

    // all types failed
    throw fail(union_error(this.#of), x, options);
  }

  toJSON() {
    return { type: this.name, of: this.#of.map(t => t.toJSON()) };
  }
}
