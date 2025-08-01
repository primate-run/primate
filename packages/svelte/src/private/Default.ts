import create_root from "#create-root";
import Runtime from "#Runtime";
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
}
