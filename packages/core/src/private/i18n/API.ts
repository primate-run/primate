import type Catalogs from "#i18n/Catalogs";

type RestoreRequest = {
  cookies?: Record<string, string | undefined>;
};

export default interface API<C extends Catalogs> {
  readonly defaultLocale: keyof C & string;
  readonly locales: readonly (keyof C & string)[];
  readonly catalogs: C;
  readonly currency: string;

  readonly locale: {
    get(): keyof C & string;
    set(locale: keyof C & string): void;
  };

  restore(request?: RestoreRequest): void;
}
