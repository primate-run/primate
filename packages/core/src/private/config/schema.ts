import Module from "#module/Module";
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
  modules: array(constructor(Module)).optional(),
  pages: {
    app: string.default("app.html"),
    error: string.default("error.html"),
  },
  log: {
    trace: boolean.default(true),
  },
  http: {
    host: string.default("localhost"),
    port: uint.port().default(6161),
    headers: record(string, string).optional(),
    csp: record(string, array(string)).optional(),
    static: {
      root: string.default("/"),
    },
    ssl: {
      key: union(FileRef, string).optional(),
      cert: union(FileRef, string).optional(),
    },
  },
  request: {
    body: {
      parse: boolean.default(true),
    },
  },
  build: {
    name: string.default("app"),
    includes: array(string).optional(),
    excludes: array(string).optional(),
    define: record(string, string).optional(),
    options: record(string, unknown).optional(),
  },
});
