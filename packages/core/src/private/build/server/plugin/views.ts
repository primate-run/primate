import type BuildApp from "#build/App";
import fs from "@rcompat/fs";
import type { Plugin } from "esbuild";

export default function plugin_server_views(app: BuildApp): Plugin {
  return {
    name: "primate/server/views",
    setup(build) {
      build.onResolve({ filter: /^app:views/ }, () => {
        return { path: "views-virtual", namespace: "primate-views" };
      });

      build.onLoad({ filter: /.*/, namespace: "primate-views" }, async () => {
        const files = await app.path.views.files({ recursive: true });
        const roots = Object.keys(app.roots);
        const contents = `
        const view = [];
        ${files.map((file, i) => {
          const path = app.basename(file, app.path.views);
          return `
            import * as view${i} from "${fs.webpath(`view:${path}`)}";
            view.push(["${fs.webpath(path)}", view${i}]);`;
        }).join("\n")}

        ${roots.map((filename, i) => `
          import * as root${i} from "app:root/${filename}";
          view.push(["${filename}", root${i}]);
        `).join("\n")}

        export default view;`;

        return {
          contents,
          loader: "js",
          resolveDir: app.root.path,
        };
      });
    },
  };
}

