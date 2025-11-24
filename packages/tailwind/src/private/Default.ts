import plugin from "#plugin";
import Runtime from "#Runtime";
import type BuildApp from "@primate/core/BuildApp";
import type NextBuild from "@primate/core/NextBuild";
import p from "pema";

export default class Tailwind extends Runtime {
  #options: typeof Tailwind.options;

  static schema = p({
    content: p.array(p.string).default([
      "./views/**/*.{tsx,jsx,ts,js}",
      "./components/**/*.{tsx,jsx,ts,js}",
      "./routes/**/*.{tsx,jsx,ts,js}",
    ]),
    config: p.string.default("./tailwind.config.js"),
  });

  static options = Tailwind.schema.infer;
  static input = Tailwind.schema.input;

  constructor(options?: typeof Tailwind.input) {
    super();
    this.#options = Tailwind.schema.parse(options);
  }

  async build(app: BuildApp, next: NextBuild) {
    app.plugin("client", plugin({
      content: this.#options.content,
      config: this.#options.config,
      root: app.root,
    }));

    return next(app);
  }
}
