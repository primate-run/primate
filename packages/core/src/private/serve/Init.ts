import type AppFacade from "#app/Facade";
import type { Schema as LogSchema } from "#logger";
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
  facade: AppFacade;
  routes: [string, { default: any }][];
  mode: Mode;
  target: string;
  log: typeof LogSchema.infer;
  templates: Dict<string>;
  session?: SessionConfig;
};

export type { ServeInit as default };
