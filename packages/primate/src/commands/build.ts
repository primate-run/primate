import type { Mode } from "@primate/core";
import build from "@primate/core/build";
import type Flags from "@primate/core/Flags";
import c from "@rcompat/cli/color";
import print from "@rcompat/cli/print";
import runtime from "@rcompat/runtime";
import get_flag from "./get-flag.js";

function orange(x: unknown) {
  return `\x1b[38;2;255;165;0m${x}\x1b[0m`;
}

export default async function command_build(flags: string[], mode?: Mode) {
  const { name, version } = await runtime.packageJSON(import.meta.dirname);
  print(c.bold(orange((name.toUpperCase()))), orange(version), "\n\n");
  const root = await runtime.projectRoot();
  const build_flags: typeof Flags.input = {
    mode: mode ?? "production",
    target: get_flag(flags, "target"),
    dir: get_flag(flags, "dir"),
  };
  return build(root, build_flags);
};
