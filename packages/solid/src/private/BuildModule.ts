import create_root from "#client/create-root";
import BuildModule from "@primate/core/frontend/BuildModule";
import { transformSync } from "@babel/core";
// @ts-expect-error no declaration file
import solid from "babel-preset-solid";

export default class SolidReact extends BuildModule {
  name = "solid";
  root = {
    filter: /^root:solid/,
    create: create_root,
  };
  compile = {
    server: (text: string) => {
      const presets = [[solid, { generate: "ssr", hydratable: true }]];
      return transformSync(text, { presets })?.code ?? "";
    },
    client: (text: string) => {
      const presets = [[solid, { generate: "dom", hydratable: true }]];
      return { js: transformSync(text, { presets })?.code ?? "" };
    },
  };
}
