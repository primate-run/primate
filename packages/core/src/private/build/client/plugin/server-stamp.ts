import type BuildApp from "#build/App";
import type { Plugin } from "esbuild";

export default function plugin_client_server_stamp(app: BuildApp): Plugin {
  return {
    name: "primate/client/server-stamp",
    setup(build) {
      build.onResolve({ filter: /^server:stamp$/ }, () => {
        return {
          path: app.runpath("client", "server-stamp.js").path,
          sideEffects: true,
        };
      });
    },
  };
}
