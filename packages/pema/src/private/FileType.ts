import BuiltinType from "#BuiltinType";
import type Storeable from "#Storeable";

export default class FileType
  extends BuiltinType<File, "FileType">
  implements Storeable<"blob"> {

  get Type() {
    return File;
  }

  get name() {
    return "file";
  }

  get datatype() {
    return "blob" as const;
  }
}
