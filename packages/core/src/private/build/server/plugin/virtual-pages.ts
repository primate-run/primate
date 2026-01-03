import type BuildApp from "#build/App";
import type { FileRef } from "@rcompat/fs";
import fs from "@rcompat/fs";
import type { Dict } from "@rcompat/type";
import type { Plugin } from "esbuild";

const core_pkg = await fs.project.root(import.meta.dirname);

export default function plugin_server_virtual_pages(app: BuildApp): Plugin {
  return {
    name: "primate/server/virtual/pages",
    setup(build) {
      build.onResolve({ filter: /^app:pages$/ }, () => {
        return { path: "pages-virtual", namespace: "primate-pages" };
      });

      build.onLoad({ filter: /.*/, namespace: "primate-pages" }, async () => {
        const filter = /^.*\.html$/ui;
        const defaults = core_pkg.join("lib", "private", "defaults");
        const pages: Dict<FileRef> = {};

        for (const file of await defaults.files({ filter })) {
          pages[file.name] = file;
        }

        if (await app.path.pages.exists()) {
          for (const file of await app.path.pages.files({ filter })) {
            pages[file.name] = file;
          }
        }

        const entries = await Promise.all(
          Object.entries(pages).map(async ([name, file]) => {
            const text = await file.text();
            return `"${name}": ${JSON.stringify(text)}`;
          }),
        );

        const contents = `
          const pages = {
            ${entries.join(",\n")}
          };
          export default pages;
        `;

        return {
          contents,
          loader: "js",
          resolveDir: app.root.path,
        };
      });
    },
  };
}
