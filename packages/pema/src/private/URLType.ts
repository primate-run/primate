import BuiltinType from "#BuiltinType";
import CoerceKey from "#CoerceKey";
import Loose from "#Loose";
import Storable from "#Storable";
import is from "@rcompat/is";

export default class URLType<M extends boolean | undefined = undefined>
  extends BuiltinType<URL, "URLType">
  implements Storable<"url"> {
  [Loose]: M;

  constructor(mode?: M) {
    super();
    this[Loose] = mode as M;
  }

  /*get [as.out](): L extends true ? "text" : never {
    return (this[Loose] === true ? as.$("text") : as.$()) as never;
  }*/

  get Type() {
    return URL;
  }

  get name() {
    return "url" as const;
  }

  get datatype() {
    return "url" as const;
  }

  [CoerceKey](x: unknown) {
    if (!is.string(x)) return x;
    try {
      return new URL(x as string | URL);
    } catch {
      return x;
    }
  }

  toJSON() {
    return Storable.serialize(this);
  }
}
