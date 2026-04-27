import fs from "@rcompat/fs";
import route from "primate/route";

export default route({
  get() {
    return fs.ref("/tmp/data.bin");
  },
});
