// routes/file.ts
import fs from "@rcompat/fs";
import response from "primate/response";
import route from "primate/route";

const file = fs.ref("path/to/file.pdf");

export default route({
  get() {
    return response.binary(file);
  },
});
