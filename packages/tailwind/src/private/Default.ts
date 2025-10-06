import plugin from "#plugin";
import type BuildApp from "@primate/core/BuildApp";
import Module from "@primate/core/Module";
import type NextBuild from "@primate/core/NextBuild";
import pema from "pema";
import array from "pema/array";
import string from "pema/string";

export default class Tailwind extends Module {
  name = "tailwind";
  #options: typeof Tailwind.options;

  static schema = pema({
    content: array(string).default([
      "./lib/**/*.{tsx,jsx,ts,js}",
      "./components/**/*.{tsx,jsx,ts,js}",
      "./routes/**/*.{tsx,jsx,ts,js}",
    ]),
    config: string.default("./tailwind.config.js"),
  });

  static options = Tailwind.schema.infer;
  static input = Tailwind.schema.input;

  constructor(options?: typeof Tailwind.input) {
    super();
    this.#options = Tailwind.schema.parse(options);
  }

  async build(app: BuildApp, next: NextBuild) {
    app.build.plugin(plugin({
      content: this.#options.content,
      config: this.#options.config,
      root: app.root,
    }));

    return next(app);
  }
}
