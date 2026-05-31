import type create_i18n from "#i18n/config";

type MissingI18N = ReturnType<typeof create_i18n>;

const message =
  "[i18n] is not configured. Add an `i18n` key to config/app.ts.";

const fail = (): never => {
  throw new Error(message);
};

export default function missing_i18n(): MissingI18N {
  const t = (() => fail()) as unknown as MissingI18N;

  Object.defineProperties(t, {
    defaultLocale: {
      get: fail,
      enumerable: true,
    },

    locales: {
      get: fail,
      enumerable: true,
    },

    catalogs: {
      get: fail,
      enumerable: true,
    },

    locale: {
      value: {
        get: fail,
        set: (_locale: string) => fail(),
      },
      enumerable: true,
    },

    currency: {
      get: fail,
      enumerable: true,
    },

    persist: {
      get: fail,
      enumerable: true,
    },
  });

  return t;
}
