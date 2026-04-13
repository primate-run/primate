import type BuildApp from "#build/App";
import E from "#errors";
import fs from "@rcompat/fs";
import runtime from "@rcompat/runtime";
import type { Plugin } from "esbuild";

const requirer = runtime.toRequire(import.meta.url);

export default function plugin_server_store(app: BuildApp): Plugin {
  return {
    name: "primate/server/native-addons",
    setup(build) {
      build.onResolve({ filter: /.*/ }, async args => {
        // only check require calls for non-relative paths
        if (args.kind === "require-call"
          && !args.path.startsWith(".")
          && !args.path.startsWith("/")) {
          try {
            // resolve the module from the import location
            const module_path = requirer.resolve(args.path, {
              paths: [args.resolveDir],
            });
            const module_dir = fs.ref(module_path).directory;
            // built-ins have no .node and would otherwise cause global search
            if (module_dir.path === ".") return null;

            // check if this module has .node files
            const node_files = await module_dir.files({
              recursive: true,
              filter: info => info.path.endsWith(".node"),
            });

            if (node_files.length > 0) {
              const { os, arch } = runtime;

              let node_file = node_files.find(f =>
                f.path.includes(`${os}-${arch}`),
              );
              node_file ??= node_files.find(f => f.path.includes(os!));
              if (node_file === undefined) throw E.build_missing_binary_addon();

              const addon_name = node_files[0].name;
              const dest = app.path.build.join("native", addon_name);
              await dest.directory.create();
              await node_files[0].copy(dest);

              app.log.info`copied native addon ${addon_name}`;

              return {
                path: `./native/${addon_name}`,
                external: true,
              };
            }
          } catch {
            // module not found or can't be resolved
          }
        }

        return null;
      });
    },
  };
};
