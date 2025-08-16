import DefaultType from "#DefaultType";
import error from "#error";
import GenericType from "#GenericType";
import schema from "#index";
import type Infer from "#Infer";
import type InferSchema from "#InferSchema";
import isParsedType from "#is-parsed-type";
import OptionalType from "#OptionalType";
import ParseError from "#ParseError";
import type ParseOptions from "#ParseOptions";
import type Schema from "#Schema";
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

export default class UnionType<T extends Schema[]> extends
  GenericType<T, InferUnion<T>, "UnionType"> {
  #types: T;

  constructor(types: T) {
    assert(types.length > 1, "union type must have at least two members");
    super();
    this.#types = types;
  }

  get name() {
    return "union";
  }

  /**
  * Value is optional.
  */
  optional() {
    return new OptionalType(this);
  }

  /**
  * Use the given default if value is missing.
  */
  default(value: (() => Infer<this>) | Infer<this>) {
    return new DefaultType(this, value);
  }

  parse(x: unknown, options: ParseOptions = {}): Infer<this> {
    // union parses when any of its members parses
    const parsed = this.#types.map(type => {
      const validator = isParsedType(type) ? type : schema(type);
      try {
        validator.parse(x, options);
        return true;
      } catch (e) {
        return e as ParseError;
      }
    });
    if (!parsed.some(r => r === true)) {
      throw new ParseError(error(union_error(this.#types), x, options));
    }

    return x as never;
  }
}
