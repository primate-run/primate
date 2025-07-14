import AppError from "#AppError";
import mark from "#mark";
import args from "@rcompat/args";
import blue from "@rcompat/cli/color/blue";
import green from "@rcompat/cli/color/green";
import red from "@rcompat/cli/color/red";
import yellow from "@rcompat/cli/color/yellow";
import print from "@rcompat/cli/print";
import union from "pema/union";

const levels = {
  error: 0,
  warn: 1,
  info: 2,
} as const;

type Levels = typeof levels;
type Level = keyof Levels;
type N = Levels[Level];

const flag = "--log=";
const n = args.find(arg => arg.startsWith(flag))?.slice(flag.length);
const vn = union(...Object.keys(levels)).optional().validate(n) as Level;

class Log {
  #level: N;

  constructor(level: N) {
    this.#level = level;
  }

  system(message: string, ...params: unknown[]) {
    print(`${blue("++")} ${mark(message, ...params)}\n`);
  }

  info(message: string, ...params: unknown[]) {
    if (this.#level === levels.info) {
      print(green("--"), mark(message, ...params), "\n");
    }
  }

  warn(message: string, ...params: unknown[]) {
    if (this.#level >= levels.warn) {
      print(yellow("??"), mark(message, ...params), "\n");
    }
  }

  error(error: unknown) {
    if (error instanceof AppError) {
      print(red("!!"), error.message, "\n");
    } else {
      console.log(error);
    }
  }
}

export default new Log(n === undefined ? levels.warn : levels[vn]);
