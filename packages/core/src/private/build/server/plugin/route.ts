import type BuildApp from "#build/App";
import fail from "#fail";
import wrap from "#route/wrap";
import fs from "@rcompat/fs";
import type { FileRef } from "@rcompat/fs";
import type { Plugin } from "esbuild";

const contents = "export default {};";

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
          throw fail(
            `cannot find route source for "${relative}" under ${path_routes.path}`,
          );
        }

        // normalise "routes/foo.ext" -> "foo" for router
        const relative_from_routes = file.path.split("routes").pop()!;
        const no_extensions = relative_from_routes
          .replace(/^[\\/]/, "")
          .slice(0, -extension.length);
        const route_path = no_extensions.replace(/\\/g, "/");
        const resolveDir = file.directory.path;
        const watchFiles = [file.path];

        const binder = app.binder(file);
        if (!binder) return { contents, loader: "js", resolveDir, watchFiles };

        const compiled = await binder(file, {
          build: { id: app.id },
          context: "routes",
        });

        return {
          contents: wrap(compiled, route_path, app.id),
          loader: extension === ".ts" ? "ts" : "js",
          resolveDir,
          watchFiles,
        };
      });
    },
  };
}
