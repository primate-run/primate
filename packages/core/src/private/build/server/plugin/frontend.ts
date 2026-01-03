import type BuildApp from "#build/App";
import fs from "@rcompat/fs";
import type { Plugin } from "esbuild";

export default function plugin_server_frontend(app: BuildApp): Plugin {
  const filter = new RegExp(
    `(${app.frontendExtensions.map(e => e.replace(".", "\\.")).join("|")})$`,
  );
  return {
    name: "primate/server/frontend",
    setup(build) {
      build.onLoad({ filter, namespace: "file" }, async args => {
        const file = fs.ref(args.path);
        const binder = app.binder(file);
        if (!binder) return null;

        const contents = await binder(file, {
          build: { id: app.id },
          context: "views",
        });

        return { contents, loader: "js", resolveDir: file.directory.path };
      });
    },
  };
}
