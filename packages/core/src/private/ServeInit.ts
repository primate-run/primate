import type Asset from "#asset/Asset";
import type Config from "#config/Config";
import type ServerConfig from "#i18n/ServerConfig";
import type Loader from "#Loader";
import type Mode from "#Mode";
import type SessionConfig from "#session/Config";
import type Dict from "@rcompat/type/Dict";
import type Schema from "pema/Schema";

type Import = {
  default: unknown;
} & Dict;

type BuildFiles = {
  routes: [string, { default: any }][];
  stores?: [string, {
    default: Schema;
    name?: string;
  }][];
};

type ServeInit = {
  assets: Asset[];
  components?: [string, Import][];
  config: Config;
  files: BuildFiles;
  loader: Loader;
  mode: Mode;
  platform: string;
  session_config: SessionConfig;
  i18n_config?: ServerConfig;
};

export type { ServeInit as default };
