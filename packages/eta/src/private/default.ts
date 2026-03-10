import init from "#init";
import frontend from "@primate/core/frontend";
import { Eta } from "eta";

const eta = new Eta();

export default frontend({
  ...init,
  compile: {
    server: (text: string) => `
      import { Eta } from "eta";
      const eta = new Eta();

      ${eta.compile(text).toString()}

      export default (props, options) => anonymous.call(eta, props, options);
    `,
  },
});
