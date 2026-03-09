import type BuildApp from "#build/App";
import location from "#location";
import type { Plugin } from "esbuild";

export default function plugin_client_view(app: BuildApp): Plugin {
  return {
    name: "primate/client/view",
    setup(build) {
      build.onResolve({ filter: /^view:/ }, args => {
        const name = args.path.slice("view:".length);
        return { path: app.root.join(location.views, name).path };
      });
    },
  };
}
