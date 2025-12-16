import create_root from "#create-root";
import Runtime from "#Runtime";
import presets from "@primate/core/build/presets";
import transform from "@primate/core/build/transform";

export default class Default extends Runtime {
  root = {
    create: create_root,
  };
  compile = {
    client: (text: string) => ({ js: transform(text, presets.react).code }),
    server: (text: string) => transform(text, presets.react).code,
  };
}
