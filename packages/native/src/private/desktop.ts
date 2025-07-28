import type App from "@primate/core/App";
import location from "@primate/core/location";
import FileRef from "@rcompat/fs/FileRef";
import dedent from "@rcompat/string/dedent";

const html = /^.*.html$/u;

export default async (app: App) => {
  const server_static = app.runpath(location.server, location.static);
  // explicitly import static assets as files
  const static_imports = (await server_static.collect()).map((path, i) =>
    dedent`
      import static${i} from
        "${FileRef.webpath(`./server/static${path.debase(server_static)}`)}"
        with { type: "file" };
       static_imports["${FileRef
        .webpath(path.debase(server_static))}"] = static${i};
    `)
    .join("\n");

  const client = app.runpath(location.client);
  // explicitly import client assets as files
  const client_imports = (await Promise.all((await client.collect())
    .map(async (file, i) => {
      const type = file.extension === ".css" ? "style" : "js";
      const src = `/${file.debase(client).name}`;
      const path = `./${file.debase(`${app.path.build}/`)}`;
      return {
        src,
        path,
        code: `await FileRef.text(asset${i})`,
        type,
        empty: (await file.text()).length === 0,
      };
    }))).filter(file => !file.empty);

  const d = app.runpath(location.server, location.pages);
  const pages = await Promise.all((await FileRef.collect(d,
    file => html.test(file.path)))
    .map(async file => `${file}`.replace(`${d}/`, _ => "")));
  const app_js = client_imports.find($import => $import.src.endsWith(".js"));

  const assets_scripts = dedent`
    import Webview from "@primate/native/platform/${app.platform.target}";
    import Loader from "@primate/native/Loader";
    import FileRef from "@primate/native/FileRef";

    const static_imports = {};
    ${static_imports}

    const client_imports = {};
    ${client_imports.map(({ path, src }, i) => dedent`
      import client${i} from "${path}" with { type: "file" };
      client_imports["${FileRef.webpath(src)}"] = client${i};
      const file${i} = await FileRef.text(client${i});
    `).join("\n  ")}

    const assets = [${client_imports.map(($import, i) => dedent`{
    src: "${$import.src}",
    code: file${i},
    type: "${$import.type}",
    inline: false,
    }`).join(",\n  ")}];

    ${app_js === undefined ? "" : dedent`
      const imports = {
       app: "${FileRef.join("/", client_imports.find($import =>
    $import.src.includes("app") && $import.src.endsWith(".js"))!.src)
        .webpath()}"
      };
      // importmap
      assets.push({
        inline: true,
        code: { imports },
        type: "importmap",
      });
    `}

    const page_imports = {};
    ${pages.map((page, i) => dedent`
      import page${i} from "${FileRef.webpath(`./${location.server}/${location.pages}/${page}`)}" with { type: "file" };
      page_imports["${page}"] = page${i};`).join("\n  ")}

    const load = async resource_map =>
      Object.fromEntries(await Promise.all(Object.entries(resource_map).map(
        async ([key, url]) => [key, await FileRef.text(url)])));
    const pages = await load(page_imports);

    export default {
      assets,
      loader: new Loader({
        pages,
        rootfile: import.meta.url,
        pages_app: "${app.config("pages.app")}",
        static_root: "${app.config("http.static.root")}",
        client_imports,
        static_imports,
        Webview,
      }),
      platform: "${app.platform.name}",
    };
  `;
  await app.path.build.join("platform.js").write(assets_scripts);
};
