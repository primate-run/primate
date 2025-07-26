import Runtime from "#Runtime";
import AppError from "@primate/core/AppError";
import type BuildApp from "@primate/core/BuildApp";
import type NextBuild from "@primate/core/NextBuild";

const repository = "locales";

export default class Default extends Runtime {
  async build(app: BuildApp, next: NextBuild) {
    const root = app.root.join(repository);

    if (!await root.exists()) {
      throw new AppError("locales directory {0} missing", root);
    }

    if ((await root.list()).length === 0) {
      throw new AppError("empty locales directory {0}", root);
    }

    const base = app.path.build.join(repository);
    await base.create();

    let has_default_locale = false;

    const json_re = /^.*.json$/u;
    await Promise.all((await root.list(file => json_re.test(file.path)))
      .map(async path => {
        const name = path.base;
        const code = `export default ${await path.text()}`;
        name === this.manager.locale && (has_default_locale = true);
        await base.join(`${path.base}.js`).write(code);
      }));

    if (!(has_default_locale as boolean)) {
      throw new AppError("default locale {0} missing", this.manager.locale);;
    }

    app.server_build.push("locale");

    return next(app);
  }
}
