import init from "#init";
import frontend from "@primate/core/frontend";
import handlebars from "handlebars";

export default frontend({
  ...init,
  compile: {
    server: (text: string) => `export default ${handlebars.precompile(text)};`,
  },
});
