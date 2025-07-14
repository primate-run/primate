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
    server: (text: string) => compile(text, { generate: "server" }).js.code,
    client: (text: string) => {
      const accessors = true;
      const { js, css } = compile(text, { generate: "client", accessors });
      return { js: js.code, css: css?.code ?? "" };
    },
  };
}
