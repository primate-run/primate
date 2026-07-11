import type BuildApp from "#build/App";
import fs from "@rcompat/fs";
import type { Plugin } from "esbuild";

export default function plugin_server_frontend(app: BuildApp): Plugin {
  const frontend_extensions = app.extensions("frontend");
  const filter = new RegExp(
    `(${frontend_extensions.map(e => e.replace(".", "\\.")).join("|")})$`,
  );
  return {
    name: "primate/server/frontend",
    setup(build) {
      if (frontend_extensions.length === 0) return;
      build.onLoad({ filter, namespace: "file" }, async args => {
        const file = fs.ref(args.path);
        const loader = app.load(file);
        if (!loader) return null;

        const contents = await loader.onLoad(file, {
          build: { id: app.id },
        });

        return { contents, loader: "js", resolveDir: file.directory.path };
      });
    },
  };
}
