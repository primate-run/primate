import type BuildApp from "#build/App";
import FileRef from "@rcompat/fs/FileRef";
import type { Plugin } from "esbuild";

export default function plugin_server_frontend(app: BuildApp): Plugin {
  const filter = new RegExp(
    `(${app.frontendExtensions.map(e => e.replace(".", "\\.")).join("|")})$`,
  );
  return {
    name: "primate/server/frontend",
    setup(build) {
      build.onLoad({ filter, namespace: "file" }, async args => {
        const file = new FileRef(args.path);
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
