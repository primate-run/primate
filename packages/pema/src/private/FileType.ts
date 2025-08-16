import BuiltinType from "#BuiltinType";
import type Storeable from "#Storeable";

export default class FileType
  extends BuiltinType<File, "FileType">
  implements Storeable<"blob"> {

  constructor() {
    super("file", File);
  }

  get datatype() {
    return "blob" as const;
  }
}
