import type Asset from "#asset/Asset";
import type Config from "#config/Config";
import type Loader from "#Loader";
import type Mode from "#Mode";
import type SessionConfig from "#session/Config";
import type Dict from "@rcompat/type/Dict";
import type Schema from "pema/Schema";

type Import = Dict & {
  default: unknown;
};

type BuildFiles = {
  routes: [string, { default: any }][];
  locales?: [string, {
    default: Dict<string>;
  }][];
  stores?: [string, {
    default: Schema;
    name?: string;
  }][];
};

type ServeInit = {
  config: Config;
  files: BuildFiles;
  components?: [string, Import][];
  mode: Mode;
  platform: string;
  loader: Loader;
  assets: Asset[];
  session_config: SessionConfig;
};

export type { ServeInit as default };
