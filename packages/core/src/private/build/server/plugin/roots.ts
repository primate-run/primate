import type BuildApp from "#build/App";
import type { Plugin } from "esbuild";

export default function plugin_server_roots(app: BuildApp): Plugin {
  return {
    name: "primate/server/roots",
    setup(build) {
      build.onResolve({ filter: /^app:root\// }, args => {
        const name = args.path.slice("app:root/".length);
        return { path: name, namespace: "primate-roots" };
      });

      build.onLoad({ filter: /.*/, namespace: "primate-roots" }, args => {
        const contents = app.roots[args.path];

        if (!contents) throw new Error(`no root registered for ${args.path}`);

        return { contents, loader: "js", resolveDir: app.root.path };
      });
    },
  };
}
