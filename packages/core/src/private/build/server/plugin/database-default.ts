import type BuildApp from "#build/App";
import fail from "#fail";
import type { FileRef } from "@rcompat/fs";
import type { Dict } from "@rcompat/type";
import type { Plugin } from "esbuild";

export default function plugin_server_database_default(app: BuildApp): Plugin {
  return {
    name: "primate/server/database-default",
    setup(build) {
      build.onResolve({ filter: /^app:database$/ }, () => {
        return { path: "database-default", namespace: "primate-database" };
      });

      build.onLoad({ filter: /.*/, namespace: "primate-database" }, async () => {
        const base = app.path.config.join("database");

        const default_db = {
          contents: `
            import DefaultDatabase from "primate/database/default";
            export default new DefaultDatabase();
          `,
          loader: "js" as const,
          resolveDir: app.root.path,
        };

        if (!await base.exists()) return default_db;

        const dbs = await base.files({
          recursive: true,
          filter: f => f.name.endsWith(".ts") || f.name.endsWith(".js"),
        });
        const n = dbs.length;

        if (n === 0) return default_db;

        const by_name: Dict<FileRef> = {};
        for (const d of dbs) by_name[d.name] = d;

        const pick = (stem: string): FileRef | undefined =>
          by_name[`${stem}.ts`] ?? by_name[`${stem}.js`];

        let db: FileRef | undefined = pick("index");

        if (db === undefined) db = pick("default");

        if (db === undefined) {
          if (dbs.length === 1) db = dbs[0];
          else throw fail(
            "multiple database drivers, add index or default.(t|j)s; found {0}",
            dbs.map(f => f.name).join(", "),
          );
        }

        const contents = `export { default } from ${JSON.stringify(db.path)};`;

        return {
          contents,
          loader: "js",
          resolveDir: app.root.path,
        };
      });
    },
  };
}

