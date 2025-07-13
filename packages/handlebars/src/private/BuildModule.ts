import BuildModule from "@primate/core/frontend/BuildModule";
import handlebars from "handlebars";

export default class BuildHandlebars extends BuildModule {
  name = "handlebars";
  defaultExtension = ".hbs";
  compile = {
    server: (text: string) => `export default ${handlebars.precompile(text)};`,
  };
}
