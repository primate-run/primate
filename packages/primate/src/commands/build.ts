import core from "@primate/core";
import build from "@primate/core/build";
import Flags from "@primate/core/Flags";
import cli from "@rcompat/cli";
import runtime from "@rcompat/runtime";
import type Command from "./Command.js";

function orange(x: unknown) {
  return `\x1b[38;2;255;165;0m${x}\x1b[0m`;
}

const command_build: Command = async mode => {
  const { name, version } = await runtime.packageJSON(import.meta.dirname);

  cli.print(cli.fg.bold(orange((name.toUpperCase()))), orange(version), "\n\n");
  const root = await runtime.projectRoot();

  core.try(async () => {
    const flags = Flags.parse({
      mode: mode,
      target: runtime.flags.try("--target"),
      outdir: runtime.flags.try("--outdir"),
      log: runtime.flags.try("--log"),
    });
    await build(root, flags);
  });
};

export default command_build;
