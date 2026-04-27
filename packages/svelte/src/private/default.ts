import create_root from "#create-root";
import init from "#init";
import frontend from "@primate/core/frontend";
import type { FileRef } from "@rcompat/fs";
import esbuild from "esbuild";
import type { ModuleCompileOptions } from "svelte/compiler";
import { compile, compileModule } from "svelte/compiler";

const strip = (code: string) => {
  return esbuild.transformSync(code, {
    loader: "ts",
    format: "esm",
  }).code;
};

const options: ModuleCompileOptions = {
  experimental: { async: true },
};

export default frontend({
  ...init,
  root: {
    create: create_root,
  },
  css: {
    filter: /\.sveltecss$/,
  },
  compile: {
    client: (text: string, file: FileRef) => {
      const accessors = true;
      const { css, js } = file.path.endsWith(".js") || file.path.endsWith(".ts")
        // runes in .svelte.[j|t]s
        ? compileModule(strip(text), { generate: "client", ...options })
        : compile(text, { accessors, generate: "client", ...options })
        ;
      return { css: css?.code ?? "", js: js.code };
    },
    server: (text: string, file?: FileRef) => {
      const { js } = file?.path.endsWith(".js") || file?.path.endsWith(".ts")
        // runes in .svelte.[j|t]s
        ? compileModule(strip(text), { generate: "server", ...options })
        : compile(text, { generate: "server", ...options })
        ;
      return js.code;
    },
  },
});
