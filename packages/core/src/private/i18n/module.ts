import AppError from "#AppError";
import bye from "#bye";
import cookie from "#cookie";
import type Config from "#i18n/Config";
import COOKIE_NAME from "#i18n/constant/COOKIE_NAME";
import PERSIST_HEADER from "#i18n/constant/PERSIST_HEADER";
import type PersistMode from "#i18n/PersistMode";
import storage from "#i18n/storage";
import log from "#log";
import create from "#module/create";
import { Status } from "@rcompat/http";

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

export default function i18n_module(config: Config) {
  const default_locale = config.defaultLocale;
  const locales = Object.keys(config.locales);
  const persist: PersistMode = config.persist ?? "cookie";
  const currency = config.currency ?? "USD";
  let secure = false;

  if (locales.length < 1) fail("must have at least 1 locale");
  if (default_locale === undefined) fail("must have a default locale");
  if (!locales.includes(default_locale)) fail("default locale not in locales");

  return create({
    name: "builtin/i18n",
    setup({ onServe, onHandle, onRoute }) {
      onServe(app => {
        secure = app.secure;
      });

      onHandle(async (request, next) => {
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
        if (persist !== "cookie")
          return new Response(null, {
            headers: {
              "Content-Length": String(0),
            },
            status: Status.NO_CONTENT,
          });

        // only accept existing locales
        if (!locales.includes(requested))
          return new Response(null, {
            headers: {
              "Content-Length": String(0),
            },
            status: Status.NO_CONTENT,
          });

        const header = cookie(COOKIE_NAME, requested, {
          secure,
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
      });

      onRoute((request, next) => {
        const accept_language = request.headers.try("Accept-Language") ?? "";
        const client_locales = accept_language
          .split(",")
          .map(s => s.split(";")[0].trim())
          .filter(Boolean);
        const cookie_locale = persist === "cookie"
          ? request.cookies.try(COOKIE_NAME)
          : undefined;
        const locale = cookie_locale ??
          pick(client_locales, locales) ??
          default_locale;

        return next(request.set("i18n", {
          currency,
          mode: persist,
          locale,
          locales,
        }));
      });
    },
  });
}
