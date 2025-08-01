import create_root from "#create-root";
import Runtime from "#Runtime";
import { transformSync } from "@babel/core";
// @ts-expect-error no declaration file
import solid from "babel-preset-solid";

export default class Default extends Runtime {
  root = {
    create: create_root,
  };
  compile = {
    client: (text: string) => {
      const presets = [[solid, { generate: "dom", hydratable: true }]];
      return { js: transformSync(text, { presets })?.code ?? "" };
    },
    server: (text: string) => {
      const presets = [[solid, { generate: "ssr", hydratable: true }]];
      return transformSync(text, { presets })?.code ?? "";
    },
  };
}
