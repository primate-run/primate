import CoerceKey from "#CoerceKey";
import PrimitiveType from "#PrimitiveType";
import type Storeable from "#Storeable";
import boolish from "@rcompat/is/boolish";

export default class BooleanType
  extends PrimitiveType<boolean, "BooleanType">
  implements Storeable<"boolean"> {

  constructor() {
    super("boolean");
  }

  get datatype() {
    return "boolean" as const;
  }

  [CoerceKey](x: unknown) {
    if (boolish(x)) {
      return x === "true";
    }
    return x;
  }
}
