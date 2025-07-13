import BuildModule from "@primate/core/frontend/BuildModule";
import voby from "@rcompat/build/preset/voby";
import transform from "@rcompat/build/sync/transform";

export default class BuildVoby extends BuildModule {
  name = "voby";
  compile = {
    server: (text: string) => transform(text, voby).code,
  };
}
