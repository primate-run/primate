import type BuildApp from "#build/App";
import fs from "@rcompat/fs";
import type { Plugin } from "esbuild";

export default function plugin_client_route_view(app: BuildApp): Plugin {
  return {
    name: "primate/client/route-view",
    setup(build) {
      build.onResolve({ filter: /.*/ }, async args => {
        if (args.namespace !== "primate-route") return null;
        if (args.pluginData === "primate-view-inner") return null;

        const result = await build.resolve(args.path, {
          resolveDir: args.resolveDir,
          kind: args.kind,
          pluginData: "primate-view-inner",
        });
        if (result.errors.length > 0 || !result.path) return null;

        const resolved = fs.ref(result.path);
        if (!resolved.path.startsWith(app.path.views.path + "/")) return null;

        return {
          path: resolved.path,
          namespace: "primate-client-route-view",
        };
      });

      build.onLoad({ filter: /.*/, namespace: "primate-client-route-view" }, args => {
        const rel = fs.ref(args.path).debase(app.path.views).path.replace(/^[\\/]/, "");
        return {
          contents: `export default ${JSON.stringify(rel)};`,
          loader: "js",
          resolveDir: app.root.path,
        };
      });
    },
  };
}
