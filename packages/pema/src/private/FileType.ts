import BuiltinType from "#BuiltinType";
import Storeable from "#Storeable";

export default class FileType
  extends BuiltinType<File, "FileType">
  implements Storeable<"blob"> {

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
    return Storeable.serialize(this);
  }
}
