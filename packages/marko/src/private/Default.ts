import { compileSync } from "@marko/compiler";
import Runtime from "#Runtime";

export default class Default extends Runtime {
  compile = {
    server: (text: string) => compileSync(text, "").code,
  };
}
