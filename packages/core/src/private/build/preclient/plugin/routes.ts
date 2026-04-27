import type BuildApp from "#build/App";
import type { FileInfo } from "@rcompat/fs";
import type { Plugin } from "esbuild";

function is_hook_file(p: string) {
  const basename = p.split("/").at(-1) ?? p;
  return basename === "+hook" || basename.startsWith("+hook.");
}

export default function plugin_preclient_routes(app: BuildApp): Plugin {
  const extension_pattern = new RegExp(
    `(${app.extensions.map(e => e.replace(".", "\\.")).join("|")})$`,
  );

  function is_route_file(f: FileInfo) {
    return !f.name.endsWith("~") &&
      !f.name.startsWith(".") &&
      !f.name.startsWith("-") &&
      extension_pattern.test(f.path);
  }

  return {
    name: "primate/preclient/routes",
    setup(build) {
      build.onResolve({ filter: /^app:preclient-routes$/ }, () => {
        return { path: "preclient-routes", namespace: "primate-preclient-routes" };
      });

      build.onLoad({ filter: /.*/, namespace: "primate-preclient-routes" }, async () => {
        const route_files = await app.path.routes.files({
          filter: is_route_file,
          recursive: true,
        });
        const filtered = route_files
          .filter(file => !is_hook_file(app.basename(file, app.path.routes)));

        const contents = `
                ${filtered.map((file, i) => {
          const path = app.basename(file, app.path.routes);
          return `import route${i} from "app:route/${path}";`;
        }).join("\n")}

                export default {
                  ${filtered.map((file, i) => {
          const path = app.basename(file, app.path.routes);
          return `"${path}": route${i},`;
        }).join("\n")}
                };
              `;

        return { contents, loader: "js", resolveDir: app.root.path };
      });
    },
  };
}
