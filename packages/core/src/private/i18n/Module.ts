import AppError from "#AppError";
import bye from "#bye";
import cookie from "#cookie";
import type Config from "#i18n/Config";
import COOKIE_NAME from "#i18n/constant/COOKIE_NAME";
import PERSIST_HEADER from "#i18n/constant/PERSIST_HEADER";
import type PersistMode from "#i18n/PersistMode";
import storage from "#i18n/storage";
import log from "#log";
import Module from "#Module";
import type NextHandle from "#module/NextHandle";
import type NextRoute from "#module/NextRoute";
import type NextServe from "#module/NextServe";
import type RequestFacade from "#request/RequestFacade";
import type ServeApp from "#serve/App";
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
    const base = locale.split("-")[0];
    const index = lower.findIndex(s => s === base || s.startsWith(`${base}-`));
    if (index !== -1) return server[index];
  }
  return undefined;
}

function fail(message: string, ...params: unknown[]) {
  const error = new AppError(`{0} ${message}`, "[i18n]", ...params);
  log.error(error);
  bye();
  process.exit(1);
}

export default class I18NModule extends Module {
  name = "builtin/i18n";
  #secure = false;
  #defaultLocale: string;
  #locales: string[];
  #persist: PersistMode = "cookie";
  #currency: string;

  constructor(config: Config) {
    super();

    const defaultLocale = config.defaultLocale;
    const locales = Object.keys(config.locales);

    if (locales.length < 1) fail("must have at least 1 locale");
    if (defaultLocale === undefined) fail("must have a default locale");
    if (!locales.includes(defaultLocale)) fail("default locale not in locales");

    this.#defaultLocale = defaultLocale;
    this.#locales = locales;
    this.#persist = config.persist ?? "cookie";
    this.#currency = config.currency ?? "USD";
  }

  #configured(locale: string) {
    return this.#locales.includes(locale);
  }

  serve(app: ServeApp, next: NextServe) {
    this.#secure = app.secure;
    return next(app);
  }

  async handle(request: RequestFacade, next: NextHandle) {
    const requested = request.headers.try(PERSIST_HEADER);
    if (requested === undefined) {
      const locale = request.cookies.try(COOKIE_NAME);
      if (locale === undefined) return next(request);

      // if has cookie, run route with i18n
      return await new Promise<Response>((resolve, reject) => {
        storage().run({ locale }, async () => {
          try {
            resolve(await next(request));
          } catch (e) {
            reject(e);
          }
        });
      });
    }

    // only cookie-persistance is server-supported
    if (this.#persist !== "cookie")
      return new Response(null, {
        headers: {
          "Content-Length": String(0),
        },
        status: Status.NO_CONTENT,
      });

    // only accept configured locales
    if (!this.#configured(requested))
      return new Response(null, {
        headers: {
          "Content-Length": String(0),
        },
        status: Status.NO_CONTENT,
      });

    const header = cookie(COOKIE_NAME, requested, {
      secure: this.#secure,
      path: "/",
      sameSite: "Strict",
    });

    return new Response(null, {
      headers: {
        "Set-Cookie": header,
        "Content-Length": String(0),
      },
      status: Status.NO_CONTENT,
    });
  }

  route(request: RequestFacade, next: NextRoute) {
    const server_locales = this.#locales;
    const accept_language = request.headers.try("Accept-Language") ?? "";
    const client_locales = accept_language
      .split(",")
      .map(s => s.split(";")[0].trim())
      .filter(Boolean);

    const mode = this.#persist;

    const cookieLocale =
      mode === "cookie" ? request.cookies.try(COOKIE_NAME) : undefined;

    const locale = cookieLocale ??
      pick(client_locales, server_locales) ??
      this.#defaultLocale;

    return next({
      ...request,
      context: {
        ...request.context,
        i18n: {
          currency: this.#currency,
          mode,
          locale,
          locales: server_locales,
        },
      },
    });
  }
}
