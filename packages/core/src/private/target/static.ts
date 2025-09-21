import location from "#location";
import type Target from "#target/Target";
import FileRef from "@rcompat/fs/FileRef";
import * as esbuild from "esbuild";

const html = /^.*.html$/ui;

const target: Target = {
  name: "static",
  runner: async app => {
    app.done(async () => {
      const source = app.path.build.join("serve.js");
      const code = await source.text();
      const result = await esbuild.build({
        absWorkingDir: app.path.build.path,
        bundle: true,
        write: false,
        platform: "node",
        format: "esm",
        tsconfigRaw: {
          compilerOptions: {
            baseUrl: "${configDir}",
            paths: {
              "#i18n": ["config/i18n.ts", "config/i18n.js"],
              "#store/*": ["stores/*"],
              "#config/*": ["config/*"],
              "#database": [
                "config/database/index.ts",
                "config/database/index.js",
                "config/database/default.ts",
                "config/database/default.js",
              ],
            },
          },
        },
        target: "esnext",
        conditions: ["node", "import", "default"],
        external: ["node:*"],
        banner: {
          js: `
          import { createRequire } from "node:module";
          const require = createRequire(import.meta.url);
        ` },
        preserveSymlinks: true,
        nodePaths: [
          app.root.path,
          app.root.join("node_modules").path,
        ],
        plugins: [app.getLoader(".svelte")[1]],
        treeShaking: false,
        stdin: {
          contents: code,
          sourcefile: source.path,
          resolveDir: source.directory.path,
          loader: "js",
        },
        logLevel: "silent",
      });
      await FileRef.write(app.path.build.join("serve.dist.js"),
        result.outputFiles[0].text);
    });
    const client = app.runpath(location.client);
    const client_imports = (await client.collect())
      .map((file, i) => {
        const type = file.extension === ".css" ? "style" : "js";
        const src = `/${file.debase(client).name}`;
        const path = `./${file.debase(`${app.path.build}/`)}`;
        return {
          code: `await load_text(asset${i})`,
          path,
          src,
          type,
        };
      });
    const d = app.runpath(location.server, location.pages);
    const pages = await Promise.all(
      (await FileRef.collect(d, file => html.test(file.path)))
        .map(async file => `${file.debase(d)}`.slice(1)));
    const pages_str = pages.map(page =>
      `"${page}": await load_text(import.meta.url,
    "${FileRef.webpath(`../${location.server}/${location.pages}/${page}`)}"),`)
      .join("\n");

    const assets_scripts = `
  import Loader from "primate/Loader";
  import load_text from "primate/load-text";

  ${client_imports.map(({ path }, i) =>
      `const asset${i} = await load_text(import.meta.url, "../${path}");`)
        .join("\n  ")}
  const assets = [${client_imports.map(($import, i) => `{
  src: "${$import.src}",
  code: asset${i},
  type: "${$import.type}",
  inline: false,
  }`).join(",\n  ")}];

  const imports = {
    app: "${client_imports.find(({ src }) =>
          src.includes("app") && src.endsWith(".js"))!.src}"
  };
  // importmap
  assets.push({
    inline: true,
    code: { imports },
    type: "importmap",
  });

  const pages = {
    ${pages_str}
  };

  export default {
    assets,
    loader: new Loader({
      pages,
      rootfile: import.meta.url,
      static_root: "${app.config("http.static.root")}",
    }),
    target: "static",
  };
`;
    await app.path.build.join("target.js").write(assets_scripts);
  },
  target: "static",
};

export default target;
