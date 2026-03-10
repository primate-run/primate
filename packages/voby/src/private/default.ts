import init from "#init";
import presets from "@primate/core/build/presets";
import transform from "@primate/core/build/transform";
import frontend from "@primate/core/frontend";

export default frontend({
  ...init,
  compile: {
    server: (text: string) => transform(text, presets.voby).code,
  },
});
