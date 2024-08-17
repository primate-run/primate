import collect from "@rcompat/fs/collect";
import join from "@rcompat/fs/join";
import webpath from "@rcompat/fs/webpath";

const html = /^.*.html$/u;

export default async app => {
  const location = app.get("location");
  const http = app.get("http");
  const client = app.runpath(location.client);
  const re = /app..*(?:js|css)$/u;

  const static_imports = (await client.collect()).map((path, i) => `
    import static${i} from "${webpath(`./client${path.debase(client)}`)}" with { type: "file" };
    static_imports["${webpath(path.debase(client))}"] = static${i};`)
    .join("\n");

  const $imports = (await Promise.all((await client.collect(re, { recursive: false }))
    .map(async (file, i) => {
      const type = file.extension === ".css" ? "style" : "js";
      const src = `${http.static.root}${file.debase(client).name}`;
      const path = `./${file.debase(`${app.path.build}/`)}`;
      return {
        src,
        path,
        code: `await load_text(asset${i})`,
        type,
        empty: (await file.text()).length === 0,
      };
    }))).filter(file => !file.empty);
  const d = app.runpath(location.server, location.pages);
  const pages = await Promise.all((await collect(d, html, { recursive: true }))
    .map(async file => `${file}`.replace(`${d}/`, _ => "")));
  const app_js = $imports.find($import => $import.src.endsWith(".js"));

  const assets_scripts = `
  import Webview from "@primate/native/platform/${app.build_target}";
  import loader from "@primate/native/loader";
  import load_text from "primate/load-text";

  const static_imports = {};
  ${static_imports}

  ${$imports.map(({ path }, i) =>
    `import asset${i} from "${path}" with { type: "file" };
    const file${i} = await load_text(asset${i});`).join("\n  ")}
  const assets = [${$imports.map(($import, i) => `{
  src: "${$import.src}",
  code: file${i},
  type: "${$import.type}",
  inline: false,
  }`).join(",\n  ")}];

  ${app_js === undefined ? "" :
    `
    const imports = {
     app: "${join(http.static.root, $imports.find($import =>
    $import.src.includes("app") && $import.src.endsWith(".js")).src).webpath()}"
    };
    // importmap
    assets.push({
      inline: true,
      code: { imports },
      type: "importmap",
    });`}

  const page_imports = {};
  ${pages.map((page, i) =>
    `import page${i} from "${webpath(`./${location.server}/${location.pages}/${page}`)}" with { type: "file" };
    page_imports["${page}"] = page${i};`).join("\n  ")}

  export default {
    assets,
    loader: await loader({
      page_imports,
      static_imports,
      pages_app: "${app.get("pages.app")}",
      Webview,
    }),
    target: "${app.build_target}",
  };
`;
  await app.path.build.join("target.js").write(assets_scripts);

};
