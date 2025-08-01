import Runtime from "#Runtime";
import create_root from "#create-root";
import { compile } from "poly/compiler";

export default class Default extends Runtime {
  root = {
    create: create_root,
  };
  css = {
    filter: /\.sveltecss$/,
  };
  compile = {
    client: (text: string) => {
      const { css, js } = compile(text, { generate: "dom", hydratable: true });
      return { css: css.code, js: js.code };
    },
    server: (text: string) =>
      compile(text, { generate: "ssr", hydratable: true }).js.code,
  };
}
