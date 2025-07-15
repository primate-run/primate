import error from "#error";
import expected from "#expected";
import GenericType from "#GenericType";
import schema from "#index";
import type Infer from "#Infer";
import type InferSchema from "#InferSchema";
import is_validated_type from "#is_validated_type";
import OptionalType from "#OptionalType";
import type Schema from "#Schema";

type InferTuple<T extends Schema[]> = {
  [K in keyof T]:
  T[K] extends Schema
    ? InferSchema<T[K]>
    : "tuple-never"
};

const member_error = (i: unknown, key?: string) => {
  return key === undefined
    ? `[${i}]`
    : `${key}[${i}]`;
};

export default class TupleType<T extends Schema[]>
  extends GenericType<T, InferTuple<T>, "TupleType"> {
  #members: T;

  constructor(members: T) {
    super();
    this.#members = members;
  }

  get name() {
    return "tuple";
  }

  optional() {
    return new OptionalType(this);
  }

  validate(x: unknown, key?: string): Infer<this> {
    if (!(!!x && Array.isArray(x))) {
      throw new Error(error(expected("array", x), key));
    }

    this.#members.forEach((v, i) => {
      const validator = is_validated_type(v) ? v : schema(v);
      validator.validate(x[i], `${member_error(i, key)}` as string);
    });

    (x as unknown[]).forEach((v, i) => {
      const member = this.#members[i];
      const validator = is_validated_type(member) ? member : schema(member);
      validator.validate(v, `${member_error(i, key)}` as string);
    });

    return x as never;
  }
}
