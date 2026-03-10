import type BuildApp from "#build/App";
import type { Plugin } from "esbuild";

export default function plugin_server_request(app: BuildApp): Plugin {
  return {
    name: "primate/server/app/request",
    setup(build) {
      build.onResolve({ filter: /^app:request$/ }, ({ importer }) => {
        const frontend = [...app.frontends.entries()]
          .find(([, exts]) => exts.some(ext => importer.endsWith(ext)));
        return frontend !== undefined
          ? { namespace: "request", path: frontend[0] }
          : undefined;
      });
      build.onLoad({ filter: /.*/, namespace: "request" }, async ({ path }) => {
        const contents = `export { default } from "@primate/${path}/request";`;
        return { contents, resolveDir: app.root.path };
      });
    },
  };
}
