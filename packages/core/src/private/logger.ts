import type { LogHook } from "#module/Setup";
import c from "@rcompat/cli/color";
import print from "@rcompat/cli/print";
import { CodeError } from "@rcompat/error";
import p from "pema";

const Schema = p.union("error", "warn", "info", "trace").default("warn");

export { Schema };

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  trace: 3,
} as const;

function mark(strings: TemplateStringsArray, params: unknown[]) {
  return strings.reduce((acc, str, i) =>
    acc + (i > 0 ? c.bold(String(params[i - 1])) : "") + str, "");
}

function format(strings: TemplateStringsArray, params: unknown[]) {
  return strings.reduce((acc, str, i) =>
    acc + (i > 0 ? String(params[i - 1]) : "") + str, "");
}

type Level = keyof typeof levels;

export type LogEntry = {
  level: Level;
  message: string;
};

function run_hooks(level: Level, message: string, hooks: LogHook[]) {
  for (const hook of hooks) {
    hook({ level, message });
  }
}

// param is intentionally relaxed and not Schema.input
export default function logger(level: string = "warn", hooks: LogHook[] = []) {
  const n = levels[Schema.parse(level)];

  return {
    get level() {
      return level;
    },

    print(strings: TemplateStringsArray, ...params: unknown[]) {
      print(format(strings, params));
    },

    system(strings: TemplateStringsArray, ...params: unknown[]) {
      print(`  ${format(strings, params)}\n`);
    },

    trace(strings: TemplateStringsArray, ...params: unknown[]) {
      if (n === levels.trace) {
        print(c.blue("[TRACE]"), mark(strings, params), "\n");
      }
      run_hooks("trace", format(strings, params), hooks);
    },

    info(strings: TemplateStringsArray, ...params: unknown[]) {
      if (n >= levels.info) {
        print(c.green("[INFO]"), mark(strings, params), "\n");
      }
      run_hooks("info", format(strings, params), hooks);
    },

    warn(strings: TemplateStringsArray, ...params: unknown[]) {
      if (n >= levels.warn) {
        print(c.yellow("[WARN]"), mark(strings, params), "\n");
      }
      run_hooks("warn", format(strings, params), hooks);
    },

    error(error: unknown) {
      if (CodeError.is(error)) {
        print(c.red("[ERROR]"), mark(error.strings, error.params), "\n");
        run_hooks("error", format(error.strings, error.params), hooks);
      } else {
        console.error(error);
        run_hooks("error", (error as any).message, hooks);
      }
    },
  };
}
