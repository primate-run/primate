import type Config from "#config/Config";
import type I18NConfig from "#i18n/Config";
import type Mode from "#Mode";
import type SessionConfig from "#session/Config";
import type Dict from "@rcompat/type/Dict";

type Import = {
  default: unknown;
} & Dict;

type ServeInit = {
  assets: {
    client: Dict<{ mime: string; data: string }>;
    static: Dict<{ mime: string; data: string }>;
  };
  views?: [string, Import][];
  stores?: [string, Import][];
  config: Config;
  routes: [string, { default: any }][];
  mode: Mode;
  target: string;
  pages: Dict<string>;
  session_config?: SessionConfig;
  i18n_config?: I18NConfig;
};

export type { ServeInit as default };
