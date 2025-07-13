import BuildModule from "@primate/core/frontend/BuildModule";
import { Eta } from "eta";

const eta = new Eta();

export default class BuildEta extends BuildModule {
  name = "eta";
  compile = {
    server: (text: string) => `
      import { Eta } from "eta";
      const eta = new Eta();

      ${eta.compile(text).toString()}

      export default (props, options) => anonymous.call(eta, props, options);
    `,
  };
}
