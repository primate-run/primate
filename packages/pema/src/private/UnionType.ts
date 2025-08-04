import DefaultType from "#DefaultType";
import error from "#error";
import GenericType from "#GenericType";
import schema from "#index";
import type Infer from "#Infer";
import type InferSchema from "#InferSchema";
import is_validated_type from "#is_validated_type";
import OptionalType from "#OptionalType";
import type Schema from "#Schema";
import ValidationError from "#ValidationError";
import type ValidationOptions from "#ValidationOptions";
import assert from "@rcompat/assert";
import type TupleToUnion from "@rcompat/type/TupleToUnion";

type InferUnion<T extends Schema[]> = TupleToUnion<{
  [K in keyof T]:
  T[K] extends Schema
  ? InferSchema<T[K]>
  : "union-never"
}>;

const print = (type: unknown) => {
  const validated = is_validated_type(type);

  if (validated) {
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
  `\`${types.map(t => is_validated_type(t) ? t.name : print(t)).join(" | ")}\``;

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

  validate(x: unknown, options: ValidationOptions = {}): Infer<this> {
    // union validates when any of its members validates
    const validated = this.#types.map(type => {
      const validator = is_validated_type(type) ? type : schema(type);
      try {
        validator.validate(x, options);
        return true;
      } catch (e) {
        return e as ValidationError;
      }
    });
    if (!validated.some(r => r === true)) {
      throw new ValidationError(error(union_error(this.#types), x, options));
    }

    return x as never;
  }
}
