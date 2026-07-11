import type BuildApp from "#build/App";
import fs from "@rcompat/fs";
import type { Plugin } from "esbuild";

export default function plugin_client_route_module(app: BuildApp): Plugin {
  return {
    name: "primate/client/route-module",
    setup(build) {
      build.onResolve({ filter: /^app:route\// }, args => {
        const rel = args.path.slice("app:route/".length);
        return { path: rel, namespace: "primate-route" };
      });

      build.onLoad({ filter: /.*/, namespace: "primate-route" }, async args => {
        const base = app.path.routes.join(args.path);
        for (const ext of app.extensions("bundler")) {
          const candidate = fs.ref(base.path + ext);
          if (await candidate.exists()) {
            const loader = app.load(candidate);
            const contents = loader
              ? await loader.onLoad(candidate, { build: { id: app.id } })
              : await candidate.text();
            return {
              contents,
              loader: ext === ".ts" ? "ts" : "js",
              resolveDir: candidate.directory.path,
              watchFiles: [candidate.path],
            };
          }
        }
        return null;
      });
    },
  };
}
