import fail from "#fail";
import type Infer from "#Infer";
import type ParseOptions from "#ParseOptions";
import PrimitiveType from "#PrimitiveType";

export default class NullType extends PrimitiveType<null, "NullType"> {
  get name() {
    return "null" as const;
  }

  parse(x: unknown, options: ParseOptions = {}): Infer<this> {
    if (x !== null) throw fail(this.name, x, options);

    return x as never;
  }

  toJSON() {
    return {
      type: this.name,
    };
  }
}
