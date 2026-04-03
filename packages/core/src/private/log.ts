import color from "@rcompat/cli/color";
import mark from "@rcompat/cli/mark";
import print from "@rcompat/cli/print";
import { CodeError } from "@rcompat/error";
import runtime from "@rcompat/runtime";
import p from "pema";

const levels = {
  error: 0,
  info: 2,
  warn: 1,
} as const;

type Levels = typeof levels;
type Level = keyof Levels;
type N = Levels[Level];

const flag = "--log=";
const n = runtime.args.find(arg => arg.startsWith(flag))?.slice(flag.length);
const vn = p.union(...Object.keys(levels)).optional().parse(n) as Level;

class Log {
  #level: N;

  constructor(level: N) {
    this.#level = level;
  }

  print(message: string, ...params: unknown[]) {
    print(mark(message, ...params));
  }

  system(message: string, ...params: unknown[]) {
    print(`  ${mark(message, ...params)}\n`);
  }

  info(message: string, ...params: unknown[]) {
    if (this.#level === levels.info) {
      print(color.green("[INFO]"), mark(message, ...params), "\n");
    }
  }

  warn(message: string, ...params: unknown[]) {
    if (this.#level >= levels.warn) {
      print(color.yellow("[WARN]"), mark(message, ...params), "\n");
    }
  }

  error(error: unknown) {
    if (CodeError.is(error)) {
      const message = error.strings.reduce((acc, str, i) =>
        acc + (i > 0 ? color.bold(String(error.params[i - 1])) : "") + str, "");
      print(color.red("[ERROR]"), message, "\n");
    } else {
      console.error(error);
    }
  }
}

export default new Log(n === undefined ? levels.warn : levels[vn]);
