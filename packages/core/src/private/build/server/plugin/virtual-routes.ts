import type BuildApp from "#build/App";
import type { FileInfo, FileRef } from "@rcompat/fs";
import type { Plugin } from "esbuild";

export default function plugin_server_virtual_routes(app: BuildApp): Plugin {
  const extension_pattern = new RegExp(
    `(${app.extensions.map(e => e.replace(".", "\\.")).join("|")})$`,
  );

  const is_route_file = (f: FileInfo) =>
    !f.name.endsWith("~") &&
    !f.name.startsWith(".") &&
    extension_pattern.test(f.path);

  return {
    name: "primate/server/virtual/routes",
    setup(build) {
      const routes_path = app.path.routes;

      build.onResolve({ filter: /^app:routes$/ }, () => {
        return { path: "routes-virtual", namespace: "primate-routes" };
      });

      build.onLoad({ filter: /.*/, namespace: "primate-routes" }, async () => {
        const route_files = await routes_path.files({
          filter: is_route_file,
          recursive: true,
        });
        const watch_dirs = new Set<string>();

        const find_dirs = async (dir: FileRef) => {
          watch_dirs.add(dir.path);
          const entries = await dir.list();
          for (const entry of entries) {
            if (await entry.kind() === "directory") await find_dirs(entry);
          }
        };
        await find_dirs(app.path.routes);

        const contents = `
          const route = [];
          ${route_files.map((file, i) => {
          const path = app.basename(file, app.path.routes);
          return `const route${i} = (await import("app:route/${path}")).default;
            route.push(["${path}", route${i}]);`;
        }).join("\n")}
          export default route;
        `;

        return {
          contents,
          loader: "js",
          resolveDir: app.root.path,
          watchDirs: [...watch_dirs],
          watchFiles: route_files.map(f => f.path),
        };
      });
    },
  };
}
