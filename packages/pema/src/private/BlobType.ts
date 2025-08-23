import BuiltinType from "#BuiltinType";
import type Storeable from "#Storeable";

export default class BlobType
  extends BuiltinType<Blob, "BlobType">
  implements Storeable<"blob"> {

  get Type() {
    return Blob;
  }

  get name() {
    return "blob";
  }

  get datatype() {
    return "blob" as const;
  }
}
