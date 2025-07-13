import no_default_locale from "#error/no-default-locale";
import no_locale_directory from "#error/no-locale-directory";
import Runtime from "#Runtime";
import type BuildApp from "@primate/core/BuildApp";
import type NextBuild from "@primate/core/NextBuild";

const repository = "locales";

export default class I18N extends Runtime {
  async build(app: BuildApp, next: NextBuild) {
    const root = app.root.join(repository);

    if (!await root.exists()) {
      no_locale_directory(root);
      return next(app);
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
      no_default_locale(this.manager.locale, root);
      return next(app);
    }

    app.server_build.push("locale");

    return next(app);
  }
}
