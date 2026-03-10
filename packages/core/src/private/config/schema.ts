import type Module from "#Module";
import fs from "@rcompat/fs";
import p from "pema";

export default p({
  http: {
    csp: p.dict(p.array(p.string)).optional(),
    headers: p.dict().optional(),
    host: p.string.default("localhost"),
    port: p.uint.port().default(6161),
    ssl: {
      cert: p.union(p.is(fs.isRef), p.string).optional(),
      key: p.union(p.is(fs.isRef), p.string).optional(),
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
  modules: p.array(p.object({
    name: p.string,
    setup: p.function,
  }).shape<Module>())
    .uniqueBy(member => member.name)
    .default([]),
  request: {
    body: {
      parse: p.boolean.default(true),
    },
  },
});
