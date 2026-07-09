import type BuildApp from "#build/App";
import type { FileRef } from "@rcompat/fs";
import runtime from "@rcompat/runtime";
import type { Dict } from "@rcompat/type";
import type { Plugin } from "esbuild";

const core = await runtime.projectRoot(import.meta.dirname);

export default function plugin_server_virtual_templates(app: BuildApp): Plugin {
  return {
    name: "primate/server/virtual/templates",
    setup(build) {
      build.onResolve({ filter: /^app:templates$/ }, () => {
        return { path: "templates-virtual", namespace: "primate-templates" };
      });

      build.onLoad({ filter: /.*/, namespace: "primate-templates" }, async () => {
        const filter = /^.*\.html$/ui;
        const defaults = core.join("lib", "private", "defaults");
        const templates: Dict<FileRef> = {};

        for (const file of await defaults.files({ filter })) {
          templates[file.name] = file;
        }

        if (await app.path.templates.exists()) {
          for (const file of await app.path.templates.files({ filter })) {
            templates[file.name] = file;
          }
        }

        const entries = await Promise.all(
          Object.entries(templates).map(async ([name, file]) => {
            const text = await file.text();
            return `"${name}": ${JSON.stringify(text)}`;
          }),
        );

        const contents = `
          const templates = {
            ${entries.join(",\n")}
          };
          export default templates;
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
