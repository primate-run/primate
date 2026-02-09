import type AppFacade from "#app/Facade";
import type I18NConfig from "#i18n/Config";
import type Mode from "#Mode";
import type SessionConfig from "#session/Config";
import type { Dict } from "@rcompat/type";

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
  facade: AppFacade;
  routes: [string, { default: any }][];
  mode: Mode;
  target: string;
  pages: Dict<string>;
  session_config?: SessionConfig;
  i18n_config?: I18NConfig;
};

export type { ServeInit as default };
