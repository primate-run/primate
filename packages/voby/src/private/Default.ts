import Runtime from "#Runtime";
import presets from "@primate/core/build/presets";
import transform from "@primate/core/build/transform";

export default class Default extends Runtime {
  compile = {
    server: (text: string) => transform(text, presets.voby).code,
  };
}
