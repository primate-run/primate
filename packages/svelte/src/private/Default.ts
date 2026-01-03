import create_root from "#create-root";
import Runtime from "#Runtime";
import type { FileRef } from "@rcompat/fs";
import { compile, compileModule } from "svelte/compiler";

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
        ? compileModule(text, { generate: "client" })
        : compile(text, { accessors, generate: "client" })
        ;
      return { css: css?.code ?? "", js: js.code };
    },
    server: (text: string, file?: FileRef) => {
      const { js } = file?.path.endsWith(".js") || file?.path.endsWith(".ts")
        // runes in .svelte.[j|t]s
        ? compileModule(text, { generate: "server" })
        : compile(text, { generate: "server" })
        ;
      return js.code;
    },
  };
}
