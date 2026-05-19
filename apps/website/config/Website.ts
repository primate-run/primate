import type { Module } from "primate";
import fs from "@rcompat/fs";
import type { FileRef } from "@rcompat/fs";
import http from "@rcompat/http";
import esbuild from "esbuild";

const website: () => Module = () => {
  const extraJSFileName = "scheme-storage";
  let mode: string;
  let extraJSFileRef: FileRef;

  return {
    name: "primate-website",

    setup({ onBuild, onServe, onHandle }) {
      onBuild(async app => {
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
              filter: new RegExp(`${extraJSFileName}-.+?\\.js$`)
            });
            const targetName = buildOutFiles[0].path.split('/').pop();

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
        })
      });

      onServe(async app => {
        mode = app.mode;
        if (mode !== "production") return;
        const assetFileRefs = await app.path.client.files({
          filter: new RegExp(`${extraJSFileName}-.+?\\.js$`)
        })
        extraJSFileRef = assetFileRefs[0];
      });

      onHandle(async (request, next) => {
        if (mode !== "production") return next(request);
        const requestedAsset = request.url.pathname.slice(1);
        if (requestedAsset.startsWith(extraJSFileName)) {
          return new Response((await extraJSFileRef.text()), {
            headers: {
              "Content-Type": http.MIME.TEXT_JAVASCRIPT,
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
