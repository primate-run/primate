import type Infer from "#Infer";
import PrimitiveType from "#PrimitiveType";
import Storable from "#Storable";
import E from "#errors";
import resolve from "#resolve";
import is from "@rcompat/is";

const re = /^[\da-f]{8}-[\da-f]{4}-7[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;

export default class UUIDV7Type
  extends PrimitiveType<string, "UUIDV7Type">
  implements Storable<"uuid_v7"> {

  get name() {
    return "string" as const;
  }

  get datatype() {
    return "uuid_v7" as const;
  }

  parse(u: unknown): Infer<this> {
    const x = resolve(u);

    if (!is.string(x) || !re.test(x)) {
      throw E.invalid_format(x, `"${x}" is not a valid UUID v7`);
    }
    return x as Infer<this>;
  }

  toJSON() {
    return Storable.serialize(this);
  }
}
