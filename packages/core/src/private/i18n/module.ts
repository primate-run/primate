import cookie from "#cookie";
import type Config from "#i18n/Config";
import COOKIE_NAME from "#i18n/constant/COOKIE_NAME";
import PERSIST_HEADER from "#i18n/constant/PERSIST_HEADER";
import E from "#i18n/errors";
import type PersistMode from "#i18n/PersistMode";
import storage from "#i18n/storage";
import create from "#module/create";
import http from "@rcompat/http";
import is from "@rcompat/is";

type Locale = string;

type I18NContext = {
  currency: string;
  locale: Locale;
  locales: Locale[];
  mode: PersistMode;
};

function toLowerCase(string: string) {
  return string.toLowerCase();
}

function pick(client: Locale[], server: Locale[]): string | undefined {
  const lower = server.map(toLowerCase);

  for (const raw of client.map(toLowerCase)) {
    const locale = raw.trim();
    if (!is.text(locale)) continue;

    const exact = lower.indexOf(locale);
    if (exact !== -1) return server[exact];

    const base = locale.split("-")[0];
    const index = lower.findIndex(s => s === base || s.startsWith(`${base}-`));
    if (index !== -1) return server[index];
  }

  return undefined;
}

function no_content(headers: HeadersInit = {}) {
  return new Response(null, {
    headers: {
      ...headers,
      "Content-Length": String(0),
    },
    status: http.Status.NO_CONTENT,
  });
}

export default function i18n_module(config: Config) {
  const default_locale = config.defaultLocale;
  const locales = Object.keys(config.locales);
  const persist: PersistMode = config.persist ?? "cookie";
  const currency = config.currency ?? "USD";
  let secure = false;

  if (locales.length < 1) throw E.at_least_one_locale();
  if (default_locale === undefined) throw E.missing_default_locale(locales);
  if (!locales.includes(default_locale)) {
    throw E.unused_default_locale(default_locale, locales);
  }

  return create({
    name: "builtin/i18n",

    setup({ onServe, onHandle }) {
      onServe(app => {
        secure = app.secure;
      });

      onHandle((request, next) => {
        const requested = request.headers.try(PERSIST_HEADER);

        if (requested !== undefined) {
          if (persist !== "cookie") return no_content();
          if (!locales.includes(requested)) return no_content();

          const header = cookie(COOKIE_NAME, requested, {
            secure,
            path: "/",
            sameSite: "Strict",
          });

          return no_content({
            "Set-Cookie": header,
          });
        }

        const accept_language = request.headers.try("Accept-Language") ?? "";
        const client_locales = accept_language
          .split(",")
          .map(s => s.split(";")[0].trim())
          .filter(Boolean);

        const cookie_locale = persist === "cookie"
          ? request.cookies.try(COOKIE_NAME)
          : undefined;

        const persisted_locale = cookie_locale !== undefined
          && locales.includes(cookie_locale)
          ? cookie_locale
          : undefined;

        const locale = persisted_locale
          ?? pick(client_locales, locales)
          ?? default_locale;

        const context: I18NContext = {
          currency,
          locale,
          locales,
          mode: persist,
        };

        return storage().run(context, () => {
          return next(request.set("i18n", context));
        });
      });
    },
  });
}
