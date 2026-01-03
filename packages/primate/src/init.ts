import color from "@rcompat/cli/color";
import print from "@rcompat/cli/print";
import fs from "@rcompat/fs";
import find from "./commands/index.js";

type PkgJSON = {
  name: string;
  version: string;
};

export default async (...args: string[]) => {
  const [command, ...flags] = args;
  const {
    name,
    version,
  } = await (await fs.project.package(import.meta.dirname)).json() as PkgJSON;
  print(color.blue(color.bold(name)), color.blue(version as string), "\n");
  find(command)(flags);
};
