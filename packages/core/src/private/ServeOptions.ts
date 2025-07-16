import type Asset from "#asset/Asset";
import type Config from "#config/Config";
import type loader from "#loader";
import type Mode from "#Mode";
import type RouteExport from "#RouteExport";
import type RouteSpecial from "#RouteSpecial";
import type SessionConfig from "#session/Config";
import type Dict from "@rcompat/type/Dict";
import type Schema from "pema/Schema";

type Import = Dict & {
  default: unknown;
};

type BuildFiles = {
  routes: [string, RouteExport | RouteSpecial][];
  locales?: [string, {
    default: Dict<string>;
  }][];
  stores?: [string, {
    default: Schema;
    name?: string;
  }][];
};

type ServeOptions = {
  config: Config;
  files: BuildFiles;
  components?: [string, Import][];
  mode: Mode;
  target: string;
  loader: ReturnType<typeof loader>;
  assets: Asset[];
  session_config: SessionConfig;
};

export type { ServeOptions as default };
