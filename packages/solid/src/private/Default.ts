import create_root from "#create-root";
import Runtime from "#Runtime";
import type { PluginItem } from "@babel/core";
import { transformSync } from "@babel/core";
import transform from "@rcompat/build/sync/transform";
// @ts-expect-error no declaration file
import solid from "babel-preset-solid";

function compile(text: string, presets: PluginItem[]) {
  return transformSync(transform(text, {
    format: "esm",
    jsx: "preserve",
    loader: "tsx",
    target: "esnext",
  }).code, { presets })?.code ?? "";
}

export default class Default extends Runtime {
  root = {
    create: create_root,
  };
  compile = {
    client: (text: string) => {
      const presets = [[solid, { generate: "dom", hydratable: true }]];
      return { js: compile(text, presets) };
    },
    server: (text: string) => {
      const presets = [[solid, { generate: "ssr", hydratable: true }]];
      return compile(text, presets);
    },
  };
}
