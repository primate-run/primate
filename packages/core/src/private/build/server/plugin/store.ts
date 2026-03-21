import type BuildApp from "#build/App";
import fs from "@rcompat/fs";
import type { Plugin } from "esbuild";

export default function plugin_server_store(app: BuildApp): Plugin {
  return {
    name: "primate/server/store",
    setup(build) {
      build.onLoad({ filter: /.*/ }, async args => {
        if (args.namespace !== "file") return null;
        if (!/\.([tj]s)$/.test(args.path)) return null;

        const file = fs.ref(args.path);
        const stores_root = app.path.stores.path;
        if (!file.path.startsWith(stores_root + "/")) return null;

        return {
          contents: await file.text(),
          loader: args.path.endsWith(".ts") ? "ts" : "js",
          resolveDir: file.directory.path,
          watchFiles: [file.path],
        };
      });
    },
  };
}
