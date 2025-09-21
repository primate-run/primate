import create_root from "#create-root";
import Runtime from "#Runtime";
import FileRef from "@rcompat/fs/FileRef";
import type * as esbuild from "esbuild";
import { compile } from "svelte/compiler";

export default class Default extends Runtime {
  root = {
    create: create_root,
  };
  css = {
    filter: /\.sveltecss$/,
  };
  compile = {
    client: (text: string) => {
      const accessors = true;
      const { css, js } = compile(text, { accessors, generate: "client" });
      return { css: css?.code ?? "", js: js.code };
    },
    server: (text: string) => compile(text, { generate: "server" }).js.code,
  };
  loader: esbuild.Plugin = {
    name: "svelte/loader",
    setup(build) {
      build.onLoad({ filter: /\.svelte$/ }, async args => {
        const file = new FileRef(args.path);
        const contents = compile(await file.text(), {
          generate: "server",
          filename: args.path,
        }).js.code;
        return { contents, loader: "js", resolveDir: file.directory.path };
      });
    },
  };

}
