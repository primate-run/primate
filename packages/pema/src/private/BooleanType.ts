import CoerceKey from "#CoerceKey";
import PrimitiveType from "#PrimitiveType";
import Storeable from "#Storeable";
import boolish from "@rcompat/is/boolish";

export default class BooleanType
  extends PrimitiveType<boolean, "BooleanType">
  implements Storeable<"boolean"> {

  get name() {
    return "boolean" as const;
  }

  get datatype() {
    return "boolean" as const;
  }

  [CoerceKey](x: unknown) {
    return boolish(x) ? x === "true" : x;
  }

  toJSON() {
    return Storeable.serialize(this);
  }
}
