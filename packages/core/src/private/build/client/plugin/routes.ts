import type BuildApp from "#build/App";
import intercept from "#build/shared/intercept";
import fs from "@rcompat/fs";
import type { Plugin } from "esbuild";

export default function plugin_client_routes(app: BuildApp): Plugin {
  return {
    name: "primate/client/routes",
    setup(build) {
      build.onResolve({ filter: /.*/ }, async args => {
        if (args.pluginData === "primate-client-route-inner") return null;
        if (intercept(args, app.path.views)) return null;

        const result = await build.resolve(args.path, {
          resolveDir: args.resolveDir,
          kind: args.kind,
          pluginData: "primate-client-route-inner",
        });
        if (result.errors.length > 0 || !result.path) return null;

        const resolved = fs.ref(result.path);
        if (!resolved.path.startsWith(app.path.routes.path + "/")) return null;

        const rel = app.basename(resolved, app.path.routes);
        return {
          namespace: "primate-client-route",
          path: resolved.path,
          pluginData: { rel },
        };
      });

      build.onLoad({ filter: /.*/, namespace: "primate-client-route" }, async args => {
        const file = fs.ref(args.path);
        const rel = (args.pluginData as { rel: string }).rel;
        return {
          contents: `
            import _mod from "app:route/${rel}";
            export default _mod.connect(${JSON.stringify(`/${rel}`)});
          `,
          loader: "js",
          resolveDir: app.root.path,
          watchFiles: [file.path],
        };
      });
    },
  };
}
