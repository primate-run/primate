import FileRef from "@rcompat/fs/FileRef";
import route from "primate/route";

route.get(() => new FileRef("/tmp/data.bin"));

