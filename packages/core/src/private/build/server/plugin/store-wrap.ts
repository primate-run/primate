import type BuildApp from "#build/App";
import fs from "@rcompat/fs";
import type { Plugin } from "esbuild";

export default function plugin_server_store_wrap(app: BuildApp): Plugin {
  return {
    name: "primate/server/store-wrap",
    setup(build) {
      build.onLoad({ filter: /.*/ }, async args => {
        // only touch the default namespace
        if (args.namespace !== "file") return null;

        // only TS/JS
        if (!/\.([tj]s)$/.test(args.path)) return null;

        const file = fs.ref(args.path);
        const storesRoot = app.path.stores.path;

        // only files under app/stores
        if (!file.path.startsWith(storesRoot + "/")) return null;

        // compute logical name: stores/foo/bar.ts → "foo/bar"
        const name = file
          .debase(app.path.stores)
          .path.replace(/^[\\/]/, "")
          .replace(/\.(ts|js)$/, "");

        const contents = `export { default } from "app:store/${name}";`;

        return {
          contents,
          loader: "js",
          resolveDir: app.root.path,
        };
      });
    },
  };
}
