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

// param is intentionally relaxed and not Schema.input
export default function logger(level: string = "warn") {
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
    },

    info(strings: TemplateStringsArray, ...params: unknown[]) {
      if (n >= levels.info) {
        print(c.green("[INFO]"), mark(strings, params), "\n");
      }
    },

    warn(strings: TemplateStringsArray, ...params: unknown[]) {
      if (n >= levels.warn) {
        print(c.yellow("[WARN]"), mark(strings, params), "\n");
      }
    },

    error(error: unknown) {
      if (CodeError.is(error)) {
        print(c.red("[ERROR]"), mark(error.strings, error.params), "\n");
      } else {
        console.error(error);
      }
    },
  };
}
