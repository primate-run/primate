type ServerConfig<Locale extends string = string> = {
  defaultLocale: Locale;
  locales: Locale[];
  currency?: string;
};

export type { ServerConfig as default };
