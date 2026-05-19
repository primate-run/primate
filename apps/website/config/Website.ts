import type { FileRef } from "@rcompat/fs";
import fs from "@rcompat/fs";
import http from "@rcompat/http";
import esbuild from "esbuild";
import type { Module } from "primate";

const website: () => Module = () => {
  const extraJSFileName = "scheme-storage";
  let mode: string;
  let extraJSFileRef: FileRef;

  return {
    name: "primate-website",

    setup({ onBuild, onServe, onHandle }) {
      onBuild(async app => {
        const views = app.path.views;

        // collect guide categories and names
        const base = views.join("docs", "guides");
        const guides = await base.files({
          recursive: true,
          filter: info => info.type === "file",
        });
        const categories = new Map<string, { name: string; path: string }[]>;
        for (const guide of guides) {
          const name = ((await guide.text()).split("\n")[1].slice("name: ".length));
          const [category, path] = guide.debase(base).path.slice(1).split("/");

          categories.set(category, (categories.get(category) ?? []).concat({
            name,
            path: path.slice(0, -".md".length),
          }));
        }

        await app.runpath("guides.json").writeJSON([...categories.entries()]);

        app.done(async () => {
          const schemeStorageFile = app.path.client.join(`${extraJSFileName}.ts`);
          const clientDir = app.path.build.join("client");
          const buildOptions: esbuild.BuildOptions = {
            entryPoints: [schemeStorageFile.path],
            outdir: clientDir.path,
            format: "esm",
            platform: "browser",
          };
          if (app.mode === "production") {
            esbuild.buildSync({
              ...buildOptions,
              entryNames: `${extraJSFileName}-[hash]`,
              sourcemap: false,
              bundle: true,
              minify: true,
            });

            const buildOutFiles = await fs.files(clientDir.path, {
              filter: new RegExp(`${extraJSFileName}-.+?\\.js$`),
            });
            const targetName = buildOutFiles[0].path.split("/").pop();

            const serverFile = app.path.build.join("server.js");
            const replaced = (await serverFile.text()).split(`${extraJSFileName}.js`)
              .join(targetName);
            serverFile.write(replaced);
          } else {
            esbuild.buildSync({
              ...buildOptions,
              entryNames: `${extraJSFileName}`,
              sourcemap: true,
              bundle: false,
              minify: false,
            });
          }
        });
      });

      onServe(async app => {
        mode = app.mode;
        if (mode !== "production") return;
        const assetFileRefs = await app.path.client.files({
          filter: new RegExp(`${extraJSFileName}-.+?\\.js$`),
        });
        extraJSFileRef = assetFileRefs[0];
      });

      onHandle(async (request, next) => {
        if (mode !== "production") return next(request);
        const requestedAsset = request.url.pathname.slice(1);
        if (requestedAsset.startsWith(extraJSFileName)) {
          const response = await next(request);
          return new Response((await extraJSFileRef.text()), {
            headers: {
              ...response.headers,
            },
            status: http.Status.OK,
          });
        }
        return next(request);
      });
    },
  };
};

export default website;
