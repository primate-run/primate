import type BuildApp from "#build/App";
import type { FileInfo } from "@rcompat/fs";
import type { Plugin } from "esbuild";

function is_hook_file(p: string) {
  const basename = p.split("/").at(-1) ?? p;
  return basename === "+hook" || basename.startsWith("+hook.");
}

export default function plugin_server_virtual_routes(app: BuildApp): Plugin {
  const extension_pattern = new RegExp(
    `(${app.extensions.map(e => e.replace(".", "\\.")).join("|")})$`,
  );

  const is_route_file = (f: FileInfo) =>
    !f.name.endsWith("~") &&
    !f.name.startsWith(".") &&
    !f.name.startsWith("-") &&
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

        const contents = `
          import router from "primate/router";
          const route = [];
          ${route_files.map((file, i) => {
          const path = app.basename(file, app.path.routes);
          const is_hook = is_hook_file(path);
          return `
              const route${i} = (await import("app:route/${path}")).default;
              ${is_hook
              ? `router.addHook("${path}", route${i});`
              : `for (const [method, handler] of Object.entries(route${i})) {
                     router.add("${path}", method, handler);
                   }
                   route.push(["${path}", route${i}]);`
            }
            `;
        }).join("\n")}
          export default route;
        `;

        const watchDirs = (await app.path.routes.dirs({
          recursive: true,
        })).map(f => f.toString());

        return {
          contents,
          loader: "js",
          resolveDir: app.root.path,
          watchDirs,
          watchFiles: route_files.map(f => f.path),
        };
      });
    },
  };
}
