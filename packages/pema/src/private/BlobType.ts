import BuiltinType from "#BuiltinType";
import Storable from "#Storable";

export default class BlobType
  extends BuiltinType<Blob, "BlobType">
  implements Storable<"blob"> {

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
    return Storable.serialize(this);
  }
}
