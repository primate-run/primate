import type BuildApp from "#build/App";
import type FileRef from "@rcompat/fs/FileRef";
import type { Plugin } from "esbuild";

export default function plugin_server_virtual_routes(app: BuildApp): Plugin {
  const extension_pattern = new RegExp(
    `(${app.extensions.map(e => e.replace(".", "\\.")).join("|")})$`,
  );

  const is_route_file = (f: FileRef) =>
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
        const route_files = await routes_path.collect(is_route_file);
        const watchDirs = new Set<string>();

        const findDirs = async (dir: FileRef) => {
          watchDirs.add(dir.path);
          const entries = await dir.list();
          for (const entry of entries) {
            if (await entry.isDirectory()) {
              await findDirs(entry);
            }
          }
        };
        await findDirs(app.path.routes);

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
          watchDirs: [...watchDirs],
          watchFiles: route_files.map(f => f.path),
        };
      });
    },
  };
}
