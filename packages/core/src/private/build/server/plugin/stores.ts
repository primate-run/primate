import type BuildApp from "#build/App";
import FileRef from "@rcompat/fs/FileRef";
import type { Plugin } from "esbuild";

export default function plugin_server_stores(app: BuildApp): Plugin {
  const base = app.path.stores;
  return {
    name: "primate/server/stores",
    setup(build) {
      build.onResolve({ filter: /^app:stores$/ }, () => {
        return { path: "stores-virtual", namespace: "primate-stores" };
      });

      build.onLoad({ filter: /.*/, namespace: "primate-stores" }, async () => {
        const stores = await Promise.all(
          (await base.list({ filter: /\.[jt]s$/ }))
            .map(async path => `${path}`.replace(base.toString(), _ => "")),
        );

        const contents = `
        const stores = {};
        ${stores.map(path => path.slice(1, -".js".length)).map((bare, i) =>
          `import * as store${i} from "${FileRef.webpath(`app:store/${bare}`)}";
           stores["${FileRef.webpath(bare)}"] = store${i}.default;`,
        ).join("\n")}
        export default stores;
      `;

        return { contents, loader: "js", resolveDir: app.root.path };
      });
    },
  };
}
