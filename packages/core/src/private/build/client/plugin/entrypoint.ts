import type BuildApp from "#build/App";
import type { Plugin } from "esbuild";

export default function plugin_client_entrypoint(app: BuildApp): Plugin {
  return {
    name: "primate/client/entrypoint",
    setup(build) {
      build.onResolve({ filter: /^app:client$/ }, () => {
        return { path: "client-entrypoint", namespace: "primate-client" };
      });

      build.onLoad({ filter: /.*/, namespace: "primate-client" }, async () => {
        const contents = app.entrypoints;

        return { contents, loader: "js", resolveDir: app.root.path };
      });
    },
  };
}
