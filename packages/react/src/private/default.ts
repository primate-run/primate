import create_root from "#create-root";
import init from "#init";
import frontend from "@primate/core/frontend";
import presets from "@primate/core/build/presets";
import transform from "@primate/core/build/transform";

export default frontend({
  ...init,
  root: {
    create: create_root,
  },
  compile: {
    client: (text: string) => ({ js: transform(text, presets.react).code }),
    server: (text: string) => transform(text, presets.react).code,
  },
});
