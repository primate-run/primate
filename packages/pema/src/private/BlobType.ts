import BuiltinType from "#BuiltinType";
import Storeable from "#Storeable";

export default class BlobType
  extends BuiltinType<Blob, "BlobType">
  implements Storeable<"blob"> {

  get Type() {
    return Blob;
  }

  get name() {
    return "blob" as const;
  }

  get datatype() {
    return "blob" as const;
  }

  toJSON() {
    return Storeable.serialize(this);
  }
}
