import header from "#header";
import Manager from "#Manager";
import AppError from "@primate/core/AppError";
import Module from "@primate/core/Module";
import type NextHandle from "@primate/core/NextHandle";
import type NextRoute from "@primate/core/NextRoute";
import type NextServe from "@primate/core/NextServe";
import type RequestFacade from "@primate/core/request/RequestFacade";
import type ServeApp from "@primate/core/ServeApp";
import is from "@rcompat/assert/is";
import Status from "@rcompat/http/Status";

const default_locale = "en-US";

type CookieOptions = {
  [key in "httpOnly" | "path" | "sameSite" | "secure"]: string
};
type Cookie = (
  name: string,
  value: string,
  { httpOnly, path, sameSite, secure }: CookieOptions
) => string;

const cookie: Cookie = (name, value, { httpOnly, path, sameSite, secure }) =>
  `${name}=${value};${httpOnly};Path=${path};${secure};SameSite=${sameSite}`;

const options = {
  httpOnly: "HttpOnly",
  path: "/",
  sameSite: "Strict",
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

    const set_locale = request.headers.try(header);

    if (set_locale === undefined) {
      return next(request);
    }

    return new Response(null, {
      headers: {
        "set-cookie": cookie(this.name, set_locale, options),
      },
      status: Status.OK,
    });
  }

  route(request: RequestFacade, next: NextRoute) {
    if (!this.manager.active) {
      return next(request);
    }

    const server_locales = Object.keys(this.manager.locales);
    const client_locales = request.headers.try("Accept-Language")
      ?.split(";")[0]?.split(",") ?? [];

    const locale = request.cookies.try(this.name)
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
