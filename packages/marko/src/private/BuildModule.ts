import { compileSync } from "@marko/compiler";
import BuildModule from "@primate/core/frontend/BuildModule";

export default class BuildMarko extends BuildModule {
  name = "marko";
  compile = {
    server: (text: string) => compileSync(text, "").code,
  };
}
