import AppError from "#AppError";
import bye from "#bye";
import serve from "#hook/serve";
import log from "#log";
import ServeApp from "#ServeApp";
import type ServeInit from "#ServeInit";

function fail(message: string, ...params: unknown[]) {
  const error = new AppError(`{0} ${message}`, "[i18n]", ...params);
  log.error(error);
  bye();
  process.exit(1);
}

export default async (root: string, options: ServeInit) => {
  if (options.i18n_config) {
    const { defaultLocale, locales } = options.i18n_config;

    if (locales.length === 0) return fail("must have at least one locale");
    if (!defaultLocale) return fail("must have a default locale");
    if (!locales.includes(defaultLocale))
      return fail("default locale {1} must be in locales", defaultLocale);
  }

  const app = await new ServeApp(root, options)
    .init(options.platform) as ServeApp;
  return serve(app);
};
