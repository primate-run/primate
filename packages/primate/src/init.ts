import blue from "@rcompat/cli/color/blue";
import bold from "@rcompat/cli/color/bold";
import print from "@rcompat/cli/print";
import pkg from "@rcompat/fs/project/package";
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
  } = await (await pkg(import.meta.url)).json() as PkgJSON;
  print(blue(bold(name as string)), blue(version as string), "\n");
  find(command)(flags);
};
