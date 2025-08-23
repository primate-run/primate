import BuiltinType from "#BuiltinType";
import type Storeable from "#Storeable";

export default class URLType
  extends BuiltinType<URL, "URLType">
  implements Storeable<"url"> {

  get Type() {
    return URL;
  }

  get name() {
    return "url";
  }

  get datatype() {
    return "url" as const;
  }
}
