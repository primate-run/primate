import type BuildApp from "#build/App";
import fail from "#fail";
import log from "#log";
import FileRef from "@rcompat/fs/FileRef";
import type { Plugin } from "esbuild";
import { createRequire } from "node:module";

const requirer = createRequire(import.meta.url);

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
            const module_dir = new FileRef(module_path).directory;
            // built-ins have no .node and would otherwise cause global search
            if (module_dir.path === ".") return null;

            // check if this module has .node files
            const node_files = await module_dir.list({
              filter: file => file.path.endsWith(".node"),
            });

            if (node_files.length > 0) {
              const platform = process.platform;
              const arch = process.arch;

              let node_file = node_files.find(f =>
                f.path.includes(`${platform}-${arch}`),
              );
              if (!node_file) {
                node_file = node_files.find(f => f.path.includes(platform));
              }
              if (!node_file) {
                throw fail("could not find matching binary addon");
              }

              const addon_name = node_files[0].name;
              const dest = app.path.build.join("native", addon_name);
              await dest.directory.create();
              await node_files[0].copy(dest);

              log.info("copied native addon {0}", addon_name);

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
