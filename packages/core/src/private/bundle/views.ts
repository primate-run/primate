import type BuildApp from "#BuildApp";
import FileRef from "@rcompat/fs/FileRef";
import type * as esbuild from "esbuild";

export default function views(
  views_path: string,
  app: BuildApp,
  extensions: string[],
): esbuild.Plugin {
  return {
    name: "primate/server/views",
    setup(build) {
      build.onResolve({ filter: /^#view\// }, args => {
        const name = args.path.slice("#view/".length).replace(/\.(js|ts)$/, "");
        return { path: name, namespace: "primate-view-wrapper" };
      });

      build.onResolve({ filter: /.*/ }, args => {
        if (args.path.includes("/views/") || args.path.startsWith("../views/")) {
          const name = args.path.split("/views/").pop()!.replace(/\.(js|ts)$/, "");
          return { path: name, namespace: "primate-view-wrapper" };
        }
      });

      build.onLoad({ filter: /.*/, namespace: "primate-view-wrapper" }, async args => {
        const name = args.path;

        for (const ext of extensions) {
          const file = new FileRef(`${views_path}/${name}${ext}`);
          if (await file.exists()) {
            return {
              contents: `export default "${name}${ext}";`,
              loader: "js",
              resolveDir: views_path,
            };
          }
        }

        return {
          contents: `export default "${name}";`,
          loader: "js",
          resolveDir: views_path,
        };
      });

      build.onResolve({ filter: /^view:/ }, async args => {
        const name = args.path.slice("view:".length);

        for (const ext of extensions) {
          const file = new FileRef(`${views_path}/${name}${ext}`);
          if (await file.exists()) {
            return { path: file.path, namespace: "primate-view-original" };
          }
        }
      });

      build.onLoad({ filter: /.*/, namespace: "primate-view-original" }, async args => {
        const file = new FileRef(args.path);
        const binder = app.binder(file);
        if (!binder) return null;
        const contents = await binder(file, {
          build: { id: app.id, stage: app.runpath("stage") },
          context: "views",
        });

        return { contents, loader: "js", resolveDir: file.directory.path };
      });
    },
  };
}
