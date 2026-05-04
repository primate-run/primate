import CoerceKey from "#CoerceKey";
import Loose from "#Loose";
import type Mode from "#Mode";
import PrimitiveType from "#PrimitiveType";
import Storable from "#Storable";
import is from "@rcompat/is";

export default class BooleanType<M extends Mode = undefined>
  extends PrimitiveType<boolean, "BooleanType">
  implements Storable<"boolean"> {
  [Loose]: M;

  constructor(mode?: M) {
    super();
    this[Loose] = mode as M;
  }

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
