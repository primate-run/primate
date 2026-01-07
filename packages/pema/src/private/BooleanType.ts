import CoerceKey from "#CoerceKey";
import PrimitiveType from "#PrimitiveType";
import Storable from "#Storable";
import is from "@rcompat/is";

export default class BooleanType
  extends PrimitiveType<boolean, "BooleanType">
  implements Storable<"boolean"> {

  get name() {
    return "boolean" as const;
  }

  get datatype() {
    return "boolean" as const;
  }

  [CoerceKey](x: unknown) {
    return is.boolish(x) ? x === "true" : x;
  }

  toJSON() {
    return Storable.serialize(this);
  }
}
