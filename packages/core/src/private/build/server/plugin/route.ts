import type BuildApp from "#build/App";
import E from "#errors";
import type { FileRef } from "@rcompat/fs";
import fs from "@rcompat/fs";
import type { Plugin } from "esbuild";

const empty = "export default {};";

export default function plugin_server_route(app: BuildApp): Plugin {
  const path_routes = app.path.routes;
  return {
    name: "primate/server/route",
    setup(build) {
      build.onResolve({ filter: /^app:route\// }, args => {
        const rel = args.path.slice("app:route/".length);
        return { path: rel, namespace: "primate-route" };
      });
      build.onLoad({ filter: /.*/, namespace: "primate-route" }, async args => {
        const relative = args.path;
        const base = path_routes.join(relative);
        const extensions = app.extensions;
        let file: FileRef | undefined;
        let extension: string | undefined;
        for (const e of extensions) {
          const candidate = fs.ref(base.path + e);
          if (await candidate.exists()) {
            file = candidate;
            extension = e;
            break;
          }
        }
        if (!file || !extension) {
          throw E.build_missing_route(relative, path_routes);
        }
        const resolveDir = file.directory.path;
        const watchFiles = [file.path];
        const binder = app.binder(file);
        if (!binder) return { contents: empty, loader: "js", resolveDir, watchFiles };
        const compiled = await binder(file, {
          build: { id: app.id },
          context: "routes",
        });
        return {
          contents: compiled,
          loader: extension === ".ts" ? "ts" : "js",
          resolveDir,
          watchFiles,
        };
      });
    },
  };
}
