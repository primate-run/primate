import PrimitiveType from "#PrimitiveType";
import type Infer from "#Infer";
import type Storeable from "#Storeable";
import expected from "#expected";

const error_message = (name: string, x: unknown, key?: string) => {
  const base = expected(name, x);
  return key === undefined
    ? base
    : `${key}: ${base}`;
};

export default class PrimaryType
  extends PrimitiveType<string | undefined, "PrimaryType">
  implements Storeable<"primary"> {

  constructor() {
    super("primary");
  }

  get datatype() {
    return "primary" as const;
  }

  normalize(value: string) {
    return value;
  }

  validate(x: unknown, key?: string): Infer<this> {
    // the primary type is an optional ype
    if (x === undefined) {
      return x as Infer<this>;
    }

    if (typeof x !== "string") {
      throw new Error(error_message(this.name, x, key));
    }

    return x as never;
  }
}
