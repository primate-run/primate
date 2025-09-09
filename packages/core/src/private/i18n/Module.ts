import AppError from "#AppError";
import cookie from "#cookie";
import COOKIE_NAME from "#i18n/constant/COOKIE_NAME";
import PERSIST_HEADER from "#i18n/constant/PERSIST_HEADER";
import type ServerConfig from "#i18n/ServerConfig";
import Module from "#Module";
import type NextHandle from "#module/NextHandle";
import type NextRoute from "#module/NextRoute";
import type NextServe from "#module/NextServe";
import type RequestFacade from "#request/RequestFacade";
import type ServeApp from "#ServeApp";
import Status from "@rcompat/http/Status";

type Locale = string;

function toLowerCase(string: string) {
  return string.toLowerCase();
}

function pick(client: Locale[], server: Locale[]): string | undefined {
  const lower = server.map(toLowerCase);

  for (const raw of client.map(toLowerCase)) {
    const locale = raw.trim();
    if (!locale) continue;

    const exact = lower.indexOf(locale);
    if (exact !== -1) return server[exact];

    // base lang fallback (e.g. "de" -> "de-DE")
    const base = locale.split("-")[0];
    const index = lower.findIndex(s => s === base || s.startsWith(`${base}-`));
    if (index !== -1) return server[index];
  }
  return undefined;
}

export default class I18NModule extends Module {
  name = "builtin/i18n";
  #config: ServerConfig;
  #secure: boolean = false;

  constructor(config: ServerConfig) {
    super();

    if (config.locales.length < 1) {
      throw new AppError("[i18n] must have at least 1 locale");
    }
    if (!config.locales.includes(config.defaultLocale)) {
      throw new AppError("[i18n] locales don't include default locale");
    }
    this.#config = config;
  }

  #configured(locale: string) {
    return this.#config.locales.includes(locale);
  }

  serve(app: ServeApp, next: NextServe) {
    this.#secure = app.secure;

    return next(app);
  }
  handle(request: RequestFacade, next: NextHandle) {
    const requested = request.headers.try(PERSIST_HEADER);
    if (requested === undefined) return next(request);

    // only accept configured locales
    if (!this.#configured(requested)) {
      // ignore
      return new Response(null, { status: Status.NO_CONTENT });
    }

    const header = cookie(COOKIE_NAME, requested, {
      secure: this.#secure,
      path: "/",
      sameSite: "Strict",
    });

    return new Response(null, {
      headers: {
        "set-cookie": header,
      },
      status: Status.NO_CONTENT,
    });
  }

  route(request: RequestFacade, next: NextRoute) {
    const server_locales = this.#config.locales;
    const accept_language = request.headers.try("Accept-Language") ?? "";
    const client_locales = accept_language
      .split(",")
      .map(s => s.split(";")[0].trim()).filter(Boolean);

    const locale = request.cookies.try(COOKIE_NAME)
      ?? pick(client_locales, server_locales)
      ?? this.#config.defaultLocale;

    return next({
      ...request, context: {
        ...request.context,
        i18n: { locale, locales: this.#config.locales },
      },
    });
  }
}
