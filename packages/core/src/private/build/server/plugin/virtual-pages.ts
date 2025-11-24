import type BuildApp from "#build/App";
import type FileRef from "@rcompat/fs/FileRef";
import pkg from "@rcompat/fs/project/package";
import type Dict from "@rcompat/type/Dict";
import type { Plugin } from "esbuild";

const core_pkg = await pkg(import.meta.url);
const core_root = core_pkg.directory;

export default function plugin_server_virtual_pages(app: BuildApp): Plugin {
  return {
    name: "primate/server/virtual/pages",
    setup(build) {
      build.onResolve({ filter: /^app:pages$/ }, () => {
        return { path: "pages-virtual", namespace: "primate-pages" };
      });

      build.onLoad({ filter: /.*/, namespace: "primate-pages" }, async () => {
        const html = /^.*\.html$/ui;
        const is_html = (file: FileRef) => html.test(file.path);

        const defaults = core_root.join("lib", "private", "defaults");

        const pages: Dict<FileRef> = {};

        for (const file of await defaults.collect(is_html)) pages[file.name] = file;

        if (await app.path.pages.exists()) {
          for (const file of await app.path.pages.collect(is_html)) pages[file.name] = file;
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
