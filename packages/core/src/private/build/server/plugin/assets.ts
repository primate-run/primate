import type BuildApp from "#build/App";
import location from "#location";
import MIME from "@rcompat/http/mime";
import type { Dict } from "@rcompat/type";
import type { Plugin } from "esbuild";

function bytes2base64(bytes: Uint8Array): string {
  const chunk_size = 0x8000;
  let result = "";
  for (let i = 0; i < bytes.length; i += chunk_size) {
    const chunk = bytes.slice(i, i + chunk_size);
    result += String.fromCharCode(...chunk);
  }
  return btoa(result);
}

export default function plugin_server_assets(app: BuildApp): Plugin {
  return {
    name: "primate/server/assets",
    setup(build) {
      build.onResolve({ filter: /^app:assets$/ }, () => {
        return { path: "assets-virtual", namespace: "primate-assets" };
      });

      build.onLoad({ filter: /.*/, namespace: "primate-assets" }, async () => {
        if (app.mode === "production") {
          const client_files = await app.runpath(location.client).files({
            recursive: true,
          });

          const client_assets: Dict<{ mime: string; data: string }> = {};
          for (const file of client_files) {
            const pathname = `/${file.name}`;
            const bytes = await file.bytes();
            const base64 = bytes2base64(bytes);
            client_assets[pathname] = {
              mime: MIME.resolve(file.name),
              data: base64,
            };
          }

          const static_dir = app.root.join(location.static);
          const static_files = await static_dir.files({
            recursive: true,
          });

          const static_assets: Dict<{ mime: string; data: string }> = {};
          for (const file of static_files) {
            const pathname = file.debase(static_dir).path;
            const bytes = await file.bytes();
            const base64 = bytes2base64(bytes);
            static_assets[pathname] = {
              mime: MIME.resolve(file.name),
              data: base64,
            };
          }

          const contents = `
            const client_assets = ${JSON.stringify(client_assets, null, 2)};
            const static_assets = ${JSON.stringify(static_assets, null, 2)};
            export default {
              client: client_assets,
              static: static_assets,
            };
          `;

          return { contents, loader: "js", resolveDir: app.root.path };
        }
        const contents = `
          export default {
            client: {},
            static: {},
          };
        `;
        return { contents, loader: "js", resolveDir: app.root.path };
      });
    },
  };
}

