import type BuildApp from "#build/App";
import fail from "#fail";
import type { Plugin } from "esbuild";

export default function plugin_server_config(app: BuildApp): Plugin {
  return {
    name: "primate/server/config",
    setup(build) {
      build.onResolve({ filter: /^app:config$/ }, async () => {
        const ts = app.path.config.join("app.ts");
        if (await ts.exists()) return { path: ts.path };

        const js = app.path.config.join("app.js");
        if (await js.exists()) return { path: js.path };

        return {
          path: "app-config-default",
          namespace: "primate-config-default",
        };
      });

      build.onLoad({ filter: /.*/, namespace: "primate-config-default" }, () => {
        const contents = `
          import config from "primate/config";
          export default config();
        `;

        return {
          contents,
          loader: "js",
          resolveDir: app.root.path,
        };
      });

      build.onResolve({ filter: /^app:config:(.+)$/ }, async args => {
        const name = args.path.slice("app:config:".length);

        const ts = app.path.config.join(`${name}.ts`);
        if (await ts.exists()) return { path: ts.path };

        const js = app.path.config.join(`${name}.js`);
        if (await js.exists()) return { path: js.path };

        return {
          path: `app-config-${name}-default`,
          namespace: "primate-config-default",
        };
      });

      build.onLoad({ filter: /^app-config-.+-default$/, namespace: "primate-config-default" }, () => {
        return {
          contents: "export default null;",
          loader: "js",
        };
      });
    },
  };
}
