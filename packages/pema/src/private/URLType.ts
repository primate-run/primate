import BuiltinType from "#BuiltinType";
import Storeable from "#Storeable";

export default class URLType
  extends BuiltinType<URL, "URLType">
  implements Storeable<"url"> {

  get Type() {
    return URL;
  }

  get name() {
    return "url" as const;
  }

  get datatype() {
    return "url" as const;
  }

  toJSON() {
    return Storeable.serialize(this);
  }
}
