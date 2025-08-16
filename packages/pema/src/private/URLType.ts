import BuiltinType from "#BuiltinType";
import type Storeable from "#Storeable";

export default class URLType
  extends BuiltinType<URL, "URLType">
  implements Storeable<"url"> {

  constructor() {
    super("url", URL);
  }

  get datatype() {
    return "url" as const;
  }
}
