import create_root from "#create-root";
import Runtime from "#Runtime";
import type FileRef from "@rcompat/fs/FileRef";
import esbuild from "esbuild";
import { compile, compileModule } from "svelte/compiler";

const strip = (code: string) => {
  return esbuild.transformSync(code, {
    loader: "ts",
    format: "esm",
  }).code;
};

export default class Default extends Runtime {
  root = {
    create: create_root,
  };
  css = {
    filter: /\.sveltecss$/,
  };
  compile = {
    client: (text: string, file: FileRef) => {
      const accessors = true;
      const { css, js } = file.path.endsWith(".js") || file.path.endsWith(".ts")
        // runes in .svelte.[j|t]s
        ? compileModule(strip(text), { generate: "client" })
        : compile(text, { accessors, generate: "client" })
        ;
      return { css: css?.code ?? "", js: js.code };
    },
    server: (text: string, file?: FileRef) => {
      const { js } = file?.path.endsWith(".js") || file?.path.endsWith(".ts")
        // runes in .svelte.[j|t]s
        ? compileModule(strip(text), { generate: "server" })
        : compile(text, { generate: "server" })
        ;
      return js.code;
    },
  };
}
