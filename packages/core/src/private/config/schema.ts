import Module from "#Module";
import fs from "@rcompat/fs";
import p from "pema";

export default p({
  http: {
    csp: p.dict(p.array(p.string)).optional(),
    headers: p.dict().optional(),
    host: p.string.default("localhost"),
    port: p.uint.port().default(6161),
    ssl: {
      cert: p.union(fs.FileRef, p.string).optional(),
      key: p.union(fs.FileRef, p.string).optional(),
    },
    static: {
      root: p.string.default("/"),
    },
  },
  livereload: {
    exclude: p.array(p.string).optional(),
    host: p.string.optional(),
    port: p.uint.port().optional(),
  },
  modules: p.array(p.constructor(Module)).optional(),
  request: {
    body: {
      parse: p.boolean.default(true),
    },
  },
});
