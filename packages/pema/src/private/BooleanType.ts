import CoerceKey from "#CoerceKey";
import PrimitiveType from "#PrimitiveType";
import type Storeable from "#Storeable";
import boolish from "@rcompat/is/boolish";

export default class BooleanType
  extends PrimitiveType<boolean, "BooleanType">
  implements Storeable<"boolean"> {

  get name() {
    return "boolean";
  }

  get datatype() {
    return "boolean" as const;
  }

  [CoerceKey](x: unknown) {
    return boolish(x) ? x === "true" : x;
  }
}
