import { compileSync } from "@marko/compiler";
import Runtime from "#Runtime";

export default class MarkoDefault extends Runtime {
  compile = {
    server: (text: string) => compileSync(text, "").code,
  };
}
