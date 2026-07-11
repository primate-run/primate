import type BuildApp from "#build/App";
import E from "#errors";
import fs from "@rcompat/fs";
import type { Plugin } from "esbuild";

export default function plugin_server_views(app: BuildApp): Plugin {
  return {
    name: "primate/server/views",
    setup(build) {
      const frontend_extensions = app.extensions("frontend");
      const route_pages = async () => app.path.routes.files({
        filter: file => frontend_extensions.some(ext => file.path.endsWith(ext)),
        recursive: true,
      });

      build.onResolve({ filter: /^app:views/ }, () => {
        return { path: "views-virtual", namespace: "primate-views" };
      });

      build.onResolve({ filter: /^app:pages/ }, () => {
        return { path: "pages-virtual", namespace: "primate-pages" };
      });

      build.onLoad({ filter: /.*/, namespace: "primate-views" }, async () => {
        const files = await app.path.views.files({ recursive: true });
        const pages = await route_pages();
        const page_keys = new Set<string>();
        const roots = Object.keys(app.roots);
        const contents = `
        const view = [];
        ${files.map((file, i) => {
          const path = app.basename(file, app.path.views);
          return `
            import * as view${i} from "${fs.webpath(`view:${path}`)}";
            view.push(["${fs.webpath(path)}", view${i}]);`;
        }).join("\n")}

        ${pages.map((file, i) => {
          const key = fs.webpath(app.basename(file, app.path.routes));
          if (page_keys.has(key)) throw E.build_duplicate_route_page(key);
          page_keys.add(key);
          const path = file.debase(app.path.routes).path.replace(/^[\\/]/, "");
          return `
            import * as page${i} from "${fs.webpath(`page:${path}`)}";
            view.push(["$page/${key}", page${i}]);`;
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

      build.onLoad({ filter: /.*/, namespace: "primate-pages" }, async () => {
        const pages = await route_pages();
        const page_keys = new Set<string>();
        const contents = `
        const pages = [];
        ${pages.map((file, i) => {
          const key = fs.webpath(app.basename(file, app.path.routes));
          if (page_keys.has(key)) throw E.build_duplicate_route_page(key);
          page_keys.add(key);
          const path = file.debase(app.path.routes).path.replace(/^[\\/]/, "");
          return `
            pages.push(["${key}", "$page/${fs.webpath(path)}"]);`;
        }).join("\n")}

        export default pages;`;

        return {
          contents,
          loader: "js",
          resolveDir: app.root.path,
        };
      });
    },
  };
}
