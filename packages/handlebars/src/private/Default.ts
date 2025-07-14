import Runtime from "#Runtime";
import handlebars from "handlebars";

export default class Handlebars extends Runtime {
  compile = {
    server: (text: string) => `export default ${handlebars.precompile(text)};`,
  };
}
