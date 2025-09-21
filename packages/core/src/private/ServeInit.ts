import type Asset from "#asset/Asset";
import type Config from "#config/Config";
import type I18NConfig from "#i18n/Config";
import type Loader from "#Loader";
import type Mode from "#Mode";
import type SessionConfig from "#session/Config";
import type Dict from "@rcompat/type/Dict";

type Import = {
  default: unknown;
} & Dict;

type BuildFiles = {
  routes: [string, { default: any }][];
};

type ServeInit = {
  assets: Asset[];
  components?: [string, Import][];
  stores?: [string, Import][];
  config: Config;
  files: BuildFiles;
  loader: Loader;
  mode: Mode;
  target: string;
  session_config: SessionConfig;
  i18n_config?: I18NConfig;
};

export type { ServeInit as default };
