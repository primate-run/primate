import loglevel, { levels, type LogLevel } from "#loglevel";
import mark from "#mark";
import blue from "@rcompat/cli/color/blue";
import dim from "@rcompat/cli/color/dim";
import green from "@rcompat/cli/color/green";
import red from "@rcompat/cli/color/red";
import yellow from "@rcompat/cli/color/yellow";
import print from "@rcompat/cli/print";
import type StringLike from "@rcompat/type/StringLike";

const url = "https://primate.run/error";
const slice_length = "@primate/".length;
const helpat = (name: string, error: unknown) =>
  `${url}/${name.slice(slice_length)}#${error}`;

const applevel = levels[loglevel];

export interface PrimateError {
  level?: LogLevel;
  message: string;
  fix?: string;
  name?: string | undefined;
  params?: StringLike[];
  module?: string | undefined;
}

export type PrimateErrorOverrides = Partial<PrimateError>;

const make_error = (level: LogLevel , {
  message,
  fix = "",
  name,
  params = [],
  module }: Omit<PrimateError, "level">): PrimateError => ({
  level,
  fix: mark(fix, ...params.map(param => param.toString())),
  message: mark(message, ...params.map(param => param.toString())),
  name,
  module,
});

const normalize = (level: LogLevel, message: string | Omit<PrimateError, "level">) => typeof message === "string"
  ? { level, message }
  : make_error(level, message);

type RCompatColorFunction = (color: string) => string;

const log = (pre: string, color: RCompatColorFunction, error: PrimateError, override?: PrimateErrorOverrides) => {
  const { fix, module, name, message } = { ...error, ...override };
  print(color(pre), `${module !== undefined ? `${color(module)} ` : ""}${message}`, "\n");
  if (fix) {
    print(blue("++"), fix);
    name && print(dim(`\n   -> ${helpat(module ?? "", name)}`), "\n");
  }
};

export interface PrimateLogger {
  system: (message: string) => void;
  info: (error: string | PrimateError, override?: PrimateErrorOverrides) => void;
  info2: (message: string, ...params: string[]) => void;
  warn: (error: string | PrimateError, override?: PrimateErrorOverrides) => void;
  error: (error: string | PrimateError, override?: PrimateErrorOverrides, toss?: boolean) => void;
  auto: (error: PrimateError) => void;
}

export default {
  system(message) {
    log("++", blue, { level: loglevel, message });
  },

  info(error, override) {
    // info prints only on info level
    applevel === levels.info && log("--", green, normalize("info", error), override);
  },

  info2(message: string, ...params: string[]) {
    if (applevel === levels.info) {
      print(green("--"), mark(message, ...params), "\n");
    }
  },

  warn(error, override) {
    // warn prints on info and warn levels
    applevel >= levels.warn && log("??", yellow, normalize("warn", error), override);
  },

  error(error, _override, toss = true) {
    // error always prints
    const err = normalize("error", error);
    log("!!", red, err);
    if (toss) {
      err.level = "error";
      throw error;
    }
  },

  auto(error) {
    const level = error.level ?? "error";
    Object.keys(levels).includes(level) && this[level](error, {}, false);
  },
} as PrimateLogger;
