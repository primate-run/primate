import type BuildApp from "#BuildApp";
import type * as esbuild from "esbuild";

export default function db_plugin(app: BuildApp): esbuild.Plugin {
  return {
    name: "primate/database-default",
    setup(build) {
      build.onResolve({ filter: /^#database$/ }, () => {
        return { path: "database-default", namespace: "primate-database" };
      });

      build.onLoad({ filter: /.*/, namespace: "primate-database" }, () => {
        return {
          contents: `
            import DefaultDatabase from "primate/database/default";
            export default new DefaultDatabase();
          `,
          loader: "js",
          resolveDir: app.root.path,
        };
      });
    },
  };
}
