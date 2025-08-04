import error from "#error";
import GenericType from "#GenericType";
import schema from "#index";
import type Infer from "#Infer";
import type InferSchema from "#InferSchema";
import is_validated_type from "#is_validated_type";
import member_error from "#member-error";
import OptionalType from "#OptionalType";
import type Schema from "#Schema";
import ValidationError from "#ValidationError";
import type ValidationOptions from "#ValidationOptions";

type InferTuple<T extends Schema[]> = {
  [K in keyof T]:
  T[K] extends Schema
  ? InferSchema<T[K]>
  : "tuple-never"
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

  validate(x: unknown, options: ValidationOptions = {}): Infer<this> {
    if (!(!!x && Array.isArray(x))) {
      throw new ValidationError(error("array", x, options));
    }

    this.#members.forEach((v, i) => {
      const validator = is_validated_type(v) ? v : schema(v);
      validator.validate(x[i], member_error(i, options));
    });

    (x as unknown[]).forEach((v, i) => {
      const member = this.#members[i];
      const validator = is_validated_type(member) ? member : schema(member);
      validator.validate(v, member_error(i, options));
    });

    return x as never;
  }
}
