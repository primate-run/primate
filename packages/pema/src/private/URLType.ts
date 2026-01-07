import BuiltinType from "#BuiltinType";
import Storable from "#Storable";

export default class URLType
  extends BuiltinType<URL, "URLType">
  implements Storable<"url"> {

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
    return Storable.serialize(this);
  }
}
