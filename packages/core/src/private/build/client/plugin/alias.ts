import type BuildApp from "#build/App";
import type { Plugin } from "esbuild";

export default function plugin_client_alias(app: BuildApp): Plugin {
  return {
    name: "primate/client/alias",
    setup(build) {
      build.onResolve({ filter: /app:static/ }, args => {
        const path = args.path.slice("app:static/".length);
        return { path: app.root.join(path).path };
      });
    },
  };
}
