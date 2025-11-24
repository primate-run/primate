import type BuildApp from "#build/App";
import type { Plugin } from "esbuild";

export default function plugin_client_frontend(app: BuildApp): Plugin {
  return {
    name: "primate/client/frontend",
    setup(build) {
      build.onResolve({ filter: /app:frontends/ }, ({ path }) => {
        return { namespace: "frontends", path };
      });
      build.onLoad({ filter: /app:frontends/ }, async () => {
        const contents = [...app.frontends.keys()].map(name =>
          `export { default as ${name} } from "@primate/${name}";`).join("\n");
        return { contents, resolveDir: app.root.path };
      });
    },
  };
}
