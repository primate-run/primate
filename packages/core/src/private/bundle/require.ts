import FileRef from "@rcompat/fs/FileRef";
import root from "@rcompat/package/root";
import type { Plugin } from "esbuild";
import { createRequire } from "node:module";

const resolve = createRequire(import.meta.url);

function pick_entry(pkg: any) {
  if (typeof pkg.unpkg === "string") return pkg.unpkg;
  if (typeof pkg.jsdelivr === "string") return pkg.jsdelivr;
  return null;
}

export default function require(): Plugin {
  return {
    name: "prefer-published-dist",
    setup(build) {
      build.onResolve({ filter: /^[^./].*/ }, async args => {
        const scoped = args.path.startsWith("@");
        if (scoped) {
          const parts = args.path.split("/");
          if (parts.length > 2) return null;
        } else {
          if (args.path.includes("/")) return null;
        }

        let resolved: string;
        try {
          resolved = resolve.resolve(args.path, {
            paths: [args.resolveDir],
          });
        } catch {
          return null;
        }

        try {
          const pkg_directory = await root(resolved);
          const pkg = await pkg_directory.join("package.json").json();
          const candidate = pick_entry(pkg);
          if (!candidate) return null;

          const path = FileRef.resolve(pkg_directory.join(candidate).path).path;

          return { path };
        } catch {
          return null;
        }
      },
      );
    },
  };
}
