import compile from "#compile";
import create_root from "#create-root";
import Runtime from "#Runtime";
import type BuildApp from "@primate/core/BuildApp";
import type NextBuild from "@primate/core/NextBuild";

export default class Default extends Runtime {
  compile = {
    client: (text: string, _: unknown, root: boolean) => (
      { js: root ? text : compile.server(text) }
    ),
    server: (text: string) => compile.server(text),
  };
  root = {
    create: create_root,
  };

  async build(app: BuildApp, next: NextBuild) {
    this.prebuild(app);

    const source = this.root.create(app.depth(), app.i18n_active);
    app.addRoot(this.rootname, source);

    this.publish(app);
    return next(app);
  }
}
