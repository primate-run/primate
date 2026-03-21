import fs from "@rcompat/fs";
import route from "primate/route";

route.get(() => fs.ref("/tmp/data.bin"));

