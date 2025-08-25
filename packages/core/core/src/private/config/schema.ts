import Module from "#Module";
import FileRef from "@rcompat/fs/FileRef";
import pema from "pema";
import array from "pema/array";
import boolean from "pema/boolean";
import constructor from "pema/constructor";
import record from "pema/record";
import string from "pema/string";
import uint from "pema/uint";
import union from "pema/union";
import unknown from "pema/unknown";

export default pema({
  build: record(string, unknown).optional(),
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
  modules: array(constructor(Module)).optional(),
  request: {
    body: {
      parse: boolean.default(true),
    },
  },
});
