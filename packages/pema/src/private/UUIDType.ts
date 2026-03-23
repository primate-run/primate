import type Infer from "#Infer";
import PrimitiveType from "#PrimitiveType";
import Storable from "#Storable";
import UUIDV4Type from "#UUIDV4Type";
import UUIDV7Type from "#UUIDV7Type";

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

  parse(x: unknown): Infer<this> {
    if (typeof x !== "string" || !re.test(x)) {
      throw new Error(`"${x}" is not a valid UUID`);
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
