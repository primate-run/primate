import type BuildApp from "#build/App";
import runtime from "@rcompat/runtime";
import type { Plugin } from "esbuild";
import { createRequire } from "node:module";

const root = (await runtime.projectRoot(import.meta.dirname)).path;
const requirer = createRequire(import.meta.url);

export default function plugin_server_node_imports(_app: BuildApp): Plugin {
  return {
    name: "primate/server/node-imports",
    setup(build) {
      build.onResolve({ filter: /^#/ }, async args => {
        // only touch imports coming from @primate/core sources
        if (!args.importer || !args.importer.startsWith(root + "/")) {
          return null;
        }

        try {
          // anchor resolution at core_root we use our package.json "imports"
          const module_path = requirer.resolve(args.path, {
            paths: [root],
          });

          return {
            path: module_path,
            namespace: "file",
          };
        } catch { }
        // next
        return null;
      });
    },
  };
}
