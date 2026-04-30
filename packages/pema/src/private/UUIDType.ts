import type Infer from "#Infer";
import PrimitiveType from "#PrimitiveType";
import Storable from "#Storable";
import UUIDV4Type from "#UUIDV4Type";
import UUIDV7Type from "#UUIDV7Type";
import E from "#errors";
import resolve from "#resolve";
import is from "@rcompat/is";

const re = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

const v4 = new UUIDV4Type();
const v7 = new UUIDV7Type();

export default class UUIDType
  extends PrimitiveType<string, "UUIDType">
  implements Storable<"uuid"> {

  get name() {
    return "string" as const;
  }

  get datatype() {
    return "uuid" as const;
  }

  parse(u: unknown): Infer<this> {
    const x = resolve(u);

    if (!is.string(x) || !re.test(x)) {
      throw E.invalid_format(x, `"${x}" is not a valid UUID`);
    }
    return x;
  }

  toJSON() {
    return Storable.serialize(this);
  }

  v4() {
    return v4;
  }

  v7() {
    return v7;
  }
}
