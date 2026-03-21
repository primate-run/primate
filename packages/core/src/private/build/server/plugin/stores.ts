import type BuildApp from "#build/App";
import fs from "@rcompat/fs";
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
        const files = await base.files({ recursive: true, filter: /\.[jt]s$/ });
        const contents = `
    const stores = {};
    ${files.map((file, i) => {
          const bare = fs.webpath(`${file}`
            .replace(base.toString(), "")
            .replace(/\.[jt]s$/, "").slice(1));
          return `import * as store${i} from "${file}";
       stores["${bare}"] = store${i}.default;`;
        }).join("\n")}
    export default stores;
  `;
        return { contents, loader: "js", resolveDir: app.root.path };
      });
    },
  };
}
