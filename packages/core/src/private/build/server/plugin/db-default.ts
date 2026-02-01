import type BuildApp from "#build/App";
import fail from "#fail";
import type { FileRef } from "@rcompat/fs";
import type { Dict } from "@rcompat/type";
import type { Plugin } from "esbuild";

export default function plugin_server_db_default(app: BuildApp): Plugin {
  const resolveDir = app.root.path;
  const base = app.path.config.join("db");
  const default_db = {
    contents: "import db from \"primate/db\"; export default db();",
    loader: "js",
    resolveDir,
  } as const;

  return {
    name: "primate/server/db-default",
    setup(build) {
      build.onResolve({ filter: /^app:db/ }, () => {
        return { path: "db-default", namespace: "primate-db" };
      });

      build.onLoad({ filter: /.*/, namespace: "primate-db" }, async () => {
        if (!await base.exists()) return default_db;

        const dbs = await base.files({
          recursive: true,
          filter: f => f.name.endsWith(".ts") || f.name.endsWith(".js"),
        });

        if (dbs.length === 0) return default_db;

        const by_name: Dict<FileRef> = {};
        for (const d of dbs) by_name[d.name] = d;

        const pick = (stem: string): FileRef | undefined =>
          by_name[`${stem}.ts`] ?? by_name[`${stem}.js`];

        let db = pick("index") ?? pick("default");

        if (db === undefined) {
          if (dbs.length === 1) db = dbs[0];
          else throw fail(
            "multiple database drivers, add index or default.(t|j)s; found {0}",
            dbs.map(f => f.name).join(", "),
          );
        }

        return {
          contents: `export { default } from ${JSON.stringify(db.path)};`,
          loader: "js",
          resolveDir,
        };
      });
    },
  };
}

