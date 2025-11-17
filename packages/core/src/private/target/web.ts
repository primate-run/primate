import location from "#location";
import type Target from "#target/Target";

const web: Target = {
  name: "web",
  runner: async app => {
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

    const assets_scripts = `
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

  export default {
    assets,
    target: "web",
  };
`;
    await app.path.build.join("target.js").write(assets_scripts);
  },
  target: "web",
};

export default web;
