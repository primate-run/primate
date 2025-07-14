import Runtime from "#Runtime";
import { Eta } from "eta";

const eta = new Eta();

export default class Default extends Runtime {
  compile = {
    server: (text: string) => `
      import { Eta } from "eta";
      const eta = new Eta();

      ${eta.compile(text).toString()}

      export default (props, options) => anonymous.call(eta, props, options);
    `,
  };
}
