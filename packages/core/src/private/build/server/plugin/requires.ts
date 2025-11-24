import type BuildApp from "#build/App";
import type { Plugin } from "esbuild";

export default function plugin_server_requires(_app: BuildApp): Plugin {
  return {
    name: "primate/server/requires",
    setup(build) {
      build.onResolve({ filter: /.*/ }, async args => {
        // skip if we're already in our namespace (prevent recursion)
        if (args.namespace === "ignore-failed-check") return null;

        if (args.kind === "require-call"
          && !args.path.startsWith(".")
          && !args.path.startsWith("/")) {
          try {
            // resolve in a different namespace to avoid retriggering
            const result = await build.resolve(args.path, {
              kind: args.kind,
              resolveDir: args.resolveDir,
              namespace: "ignore-failed-check",
            });

            if (result.errors.length === 0) return null;
          } catch { }

          return { path: args.path, external: true };
        }

        return null;
      });
    },
  };
}
