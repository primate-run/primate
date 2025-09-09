import type Catalogs from "#i18n/Catalogs";
import type Config from "#i18n/Config";
import type sInternal from "#i18n/symbol/internal";
import type sConfig from "#symbol/config";

type LocaleTags<C extends Catalogs> = keyof C & string;

type API<C extends Catalogs> = {
  onChange(fn: (locale: LocaleTags<C>) => void): () => void;

  locale: {
    get(): LocaleTags<C>;
    set(locale: LocaleTags<C>): void;
  };

  readonly loading: boolean;

  [sConfig]: Readonly<Config<C>>;

  [sInternal]: {
    init(locale: LocaleTags<C>): void;
    wait(): Promise<void>;
    depend(fn: () => void): () => void;
    readonly version: number;
  };
};

export type { API as default };
