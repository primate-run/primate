import BuiltinType from "#BuiltinType";
import Storable from "#Storable";

export default class FileType
  extends BuiltinType<File, "FileType">
  implements Storable<"blob"> {

  get Type() {
    return File;
  }

  get name() {
    return "file" as const;
  }

  get datatype() {
    return "blob" as const;
  }

  toJSON() {
    return Storable.serialize(this);
  }
}
