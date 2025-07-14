import Runtime from "#Runtime";
import create_root from "#create-root";
import { compile } from "poly/compiler";

export default class PolyDefault extends Runtime {
  root = {
    create: create_root,
  };
  css = {
    filter: /\.polycss$/,
  };
  compile = {
    server: (text: string) =>
      compile(text, { generate: "ssr", hydratable: true }).js.code,
    client: (text: string) => {
      const { js, css } = compile(text, { generate: "dom", hydratable: true });
      return { js: js.code, css: css.code };
    },
  };
}
