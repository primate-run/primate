import FileRef from "@rcompat/fs/FileRef";
import type * as esbuild from "esbuild";

export default function stores_plugin(
  storesPath: string,
  extensions: string[],
): esbuild.Plugin {
  return {
    name: "primate/server/stores",
    setup(build) {
      build.onResolve({ filter: /^#store\// }, args => {
        const name = args.path.slice("#store/".length).replace(/\.(js|ts)$/, "");
        return { path: name, namespace: "primate-store-wrapper" };
      });

      build.onResolve({ filter: /.*/ }, args => {
        if (args.path.includes("/stores/") || args.path.startsWith("../stores/")) {
          const name = args.path.split("/stores/").pop()!.replace(/\.(js|ts)$/, "");
          return { path: name, namespace: "primate-store-wrapper" };
        }
      });

      build.onLoad({ filter: /.*/, namespace: "primate-store-wrapper" }, args => {
        const name = args.path;
        return {
          contents: `
import database from "#database";
import wrap from "primate/database/wrap";
import storeSchema from "store:${name}";

export default wrap("${name}", storeSchema, database);
`,
          loader: "js",
          resolveDir: storesPath,
        };
      });

      build.onResolve({ filter: /^store:/ }, async args => {
        const name = args.path.slice("store:".length);

        for (const ext of extensions) {
          const file = new FileRef(`${storesPath}/${name}${ext}`);
          if (await file.exists()) {
            return { path: file.path };
          }
        }
      });
    },
  };
}
