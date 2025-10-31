import Module from "#Module";
import FileRef from "@rcompat/fs/FileRef";
import p from "pema";

export default p({
  build: p.record(p.string, p.unknown).optional(),
  bundle: p.array(p.string).default([]),
  http: {
    csp: p.record(p.string, p.array(p.string)).optional(),
    headers: p.record(p.string, p.string).optional(),
    host: p.string.default("localhost"),
    port: p.uint.port().default(6161),
    ssl: {
      cert: p.union(FileRef, p.string).optional(),
      key: p.union(FileRef, p.string).optional(),
    },
    static: {
      root: p.string.default("/"),
    },
  },
  modules: p.array(p.constructor(Module)).optional(),
  request: {
    body: {
      parse: p.boolean.default(true),
    },
  },
});
