import type BuildApp from "#build/App";
import fs from "@rcompat/fs";
import type { Plugin } from "esbuild";

export default function plugin_server_view(app: BuildApp): Plugin {
  return {
    name: "primate/server/view",
    setup(build) {
      build.onResolve({ filter: /.*/ }, async args => {
        // only care about our wrapped route modules
        if (args.namespace !== "primate-route") return null;

        // avoid recursion when we call build.resolve ourselves
        if (args.pluginData === "primate-view-inner") return null;

        // let esbuild resolve this import as usual
        const result = await build.resolve(args.path, {
          resolveDir: args.resolveDir,
          kind: args.kind,
          pluginData: "primate-view-inner",
        });

        // couldn't resolve, don't interfere
        if (result.errors.length > 0 || !result.path) return null;

        const resolved = fs.ref(result.path);

        // must live under app.path.views (e.g. app/views/...)
        const views_root = app.path.views.path;
        if (!resolved.path.startsWith(views_root + "/")) return null;

        return {
          path: resolved.debase(app.path.views).path.replace(/^[\\/]/, ""),
          namespace: "primate-view-wrapper",
        };
      });

      build.onLoad({ filter: /.*/, namespace: "primate-view-wrapper" }, async args => {
        const name = args.path;

        return {
          contents: `export default ${JSON.stringify(name)};`,
          loader: "js",
          resolveDir: app.path.views.path,
        };
      });

      build.onResolve({ filter: /^view:/ }, async args => {
        const name = args.path.slice("view:".length);

        for (const ext of app.extensions) {
          const file = app.path.views.join(`${name}${ext}`);
          if (await file.exists()) {
            return { path: file.path, namespace: "primate-view-original" };
          }
        }

        return null;
      });

      build.onLoad({ filter: /.*/, namespace: "primate-view-original" }, async args => {
        const file = fs.ref(args.path);
        const binder = app.binder(file);
        if (!binder) return null;
        const contents = await binder(file, {
          build: { id: app.id },
          context: "views",
        });

        return { contents, loader: "js", resolveDir: file.directory.path };
      });
    },
  };
}
