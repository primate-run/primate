import Module from "#Module";
import FileRef from "@rcompat/fs/FileRef";
import pema from "pema";
import array from "pema/array";
import boolean from "pema/boolean";
import record from "pema/record";
import string from "pema/string";
import uint from "pema/uint";
import union from "pema/union";
import unknown from "pema/unknown";
import constructor from "pema/constructor";

export default pema({
  base: string.default("/"),
  build: {
    define: record(string, string).optional(),
    excludes: array(string).optional(),
    includes: array(string).optional(),
    name: string.default("app"),
    options: record(string, unknown).optional(),
  },
  http: {
    csp: record(string, array(string)).optional(),
    headers: record(string, string).optional(),
    host: string.default("localhost"),
    port: uint.port().default(6161),
    ssl: {
      cert: union(FileRef, string).optional(),
      key: union(FileRef, string).optional(),
    },
    static: {
      root: string.default("/"),
    },
  },
  log: {
    trace: boolean.default(true),
  },
  modules: array(constructor(Module)).optional(),
  pages: {
    app: string.default("app.html"),
    error: string.default("error.html"),
  },
  request: {
    body: {
      parse: boolean.default(true),
    },
  },
});
