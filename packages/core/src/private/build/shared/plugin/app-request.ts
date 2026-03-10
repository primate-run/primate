import type BuildApp from "#build/App";
import type { Plugin } from "esbuild";

export default function plugin_shared_app_request(app: BuildApp): Plugin {
  return {
    name: "primate/shared/app/request",
    setup(build) {
      build.onResolve({ filter: /^app:/ }, ({ path, importer }) => {
        const framework = path.slice(4);
        const exts = app.frontends.get(framework);
        return exts?.some(ext => importer.endsWith(ext))
          ? { namespace: "app-frontend", path: framework }
          : undefined;
      });
      build.onLoad({ filter: /.*/, namespace: "app-frontend" }, async ({ path }) => {
        const contents = `export * from "@primate/${path}/app";`;
        return { contents, resolveDir: app.root.path };
      });
    },
  };
}
