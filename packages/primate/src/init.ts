import c from "@rcompat/cli/color";
import print from "@rcompat/cli/print";
import fs from "@rcompat/fs";
import find from "./commands/index.js";

type PkgJSON = {
  name: string;
  version: string;
};

function orange(x: unknown) {
  return `\x1b[38;2;255;165;0m${x}\x1b[0m`;
}

export default async (...args: string[]) => {
  const [command, ...flags] = args;
  const {
    name,
    version,
  } = await (await fs.project.package(import.meta.dirname)).json() as PkgJSON;
  print(c.bold(orange((name.toUpperCase()))), orange(version), "\n\n");
  find(command)(flags);
};
