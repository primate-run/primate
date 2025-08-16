import BuiltinType from "#BuiltinType";
import type Storeable from "#Storeable";

export default class BlobType
  extends BuiltinType<Blob, "BlobType">
  implements Storeable<"blob"> {

  constructor() {
    super("blob", Blob);
  }

  get datatype() {
    return "blob" as const;
  }
}
