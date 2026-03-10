import type { Input } from "#module";
import module from "#module";
import plugin from "#plugin";
import type { Module } from "@primate/core";

export default function default_module(input: Input = {}): Module {
  const options = module.schema.parse(input);

  return {
    name: module.name,
    setup({ onBuild }) {
      onBuild(app => {

        app.plugin("client", plugin({
          content: options.content,
          config: options.config,
          root: app.root,
        }));
      });
    },
  };
}
