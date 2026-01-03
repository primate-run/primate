import type BuildApp from "#build/App";
import fs from "@rcompat/fs";
import type { Plugin } from "esbuild";

export default function plugin_server_store(app: BuildApp): Plugin {
  return {
    name: "primate/server/store",
    setup(build) {
      build.onResolve({ filter: /^app:store\// }, args => {
        const name = args.path.slice("app:store/".length).replace(/\.(js|ts)$/, "");
        return { path: name, namespace: "primate-store-wrapper" };
      });

      build.onLoad({ filter: /.*/, namespace: "primate-store-wrapper" }, args => {
        const name = args.path;
        return {
          contents: `
            import database from "app:database";
            import wrap from "primate/database/wrap";
            import schema from "store:${name}";
            export default wrap("${name}", schema, database);
          `,
          loader: "js",
          resolveDir: app.path.stores.path,
        };
      });

      build.onResolve({ filter: /^store:/ }, async args => {
        const name = args.path.slice("store:".length);

        for (const ext of app.extensions) {
          const file = fs.ref(`${app.path.stores.path}/${name}${ext}`);
          if (await file.exists()) {
            // special namespace to bypass auto-wrap
            return { path: file.path, namespace: "primate-store-raw" };
          }
        }

        return null;
      });

      build.onLoad({ filter: /.*/, namespace: "primate-store-raw" }, async args => {
        const file = fs.ref(args.path);
        const source = await file.text();
        return {
          contents: source,
          loader: args.path.endsWith(".ts") ? "ts" : "js",
          resolveDir: file.directory.path,
          watchFiles: [file.path],
        };
      });
    },
  };
}
