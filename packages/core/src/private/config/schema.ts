import type DB from "#db/DB";
import type Module from "#Module";
import fs from "@rcompat/fs";
import type { Dict } from "@rcompat/type";
import type { ObjectType, Parsed } from "pema";
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
  db: {
    migrations: p.object({
      table: p.string,
      db: p.pure<DB>(),
      blocking: p.boolean.default(true),
    }).optional(),
  },
  env: {
    schema: p.pure<ObjectType<Dict<Parsed<unknown>>>>().optional(),
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
