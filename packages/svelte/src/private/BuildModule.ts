import create_root from "#client/create-root";
import BuildModule from "@primate/core/frontend/BuildModule";
import { compile } from "svelte/compiler";

export default class BuildSvelte extends BuildModule {
  name = "svelte";
  root = {
    filter: /^root:svelte/,
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
