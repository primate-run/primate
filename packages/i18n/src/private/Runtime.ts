import header from "#header";
import Manager from "#Manager";
import AppError from "@primate/core/AppError";
import Module from "@primate/core/Module";
import type NextHandle from "@primate/core/NextHandle";
import type NextRoute from "@primate/core/NextRoute";
import type NextServe from "@primate/core/NextServe";
import type RequestFacade from "@primate/core/RequestFacade";
import type ServeApp from "@primate/core/ServeApp";
import is from "@rcompat/assert/is";
import Status from "@rcompat/http/Status";

const default_locale = "en-US";

type CookieOptions = {
  [key in "path" | "secure" | "httpOnly" | "sameSite"]: string
};
type Cookie = (
  name: string,
  value: string,
  { path, secure, httpOnly, sameSite }: CookieOptions
) => string;

const cookie: Cookie = (name, value, { path, secure, httpOnly, sameSite }) =>
  `${name}=${value};${httpOnly};Path=${path};${secure};SameSite=${sameSite}`;

const options = {
  sameSite: "Strict",
  path: "/",
  httpOnly: "HttpOnly",
  secure: "Secure",
};

export default class Runtime extends Module {
  #manager: Manager;

  constructor(locale = default_locale) {
    super();
    is(locale).string();

    this.#manager = new Manager(locale);
  }

  get name() {
    return "@primate/i18n";
  }

  get manager() {
    return this.#manager;
  }

  serve(app: ServeApp, next: NextServe) {
    const locales = app.files.locales;

    if (locales === undefined) {
      throw new AppError("no locales configured");
    }

    this.manager.init(Object.fromEntries(locales.map(([name, locale]) =>
      [name, locale],
    )));

    return next(app);
  }

  handle(request: RequestFacade, next: NextHandle) {
    if (!this.manager.active) {
      return next(request);
    }

    const set_locale = request.headers[header.toLowerCase()];

    if (set_locale === undefined) {
      return next(request);
    }

    return new Response(null, {
      status: Status.OK,
      headers: {
        "set-cookie": cookie(this.name, set_locale, options),
      },
    });
  }

  route(request: RequestFacade, next: NextRoute) {
    if (!this.manager.active) {
      return next(request);
    }

    const server_locales = Object.keys(this.manager.locales);
    const client_locales = request.headers["accept-language"]
      ?.split(";")[0]?.split(",") ?? [];

    const locale = request.cookies[this.name]
      ?? client_locales.find(c_locale => server_locales.includes(c_locale))
      ?? this.manager.locale;

    return next({
      ...request, context: {
        ...request.context,
        i18n: { locale, locales: this.manager.locales },
      },
    });
  }
}
