import color from "@rcompat/cli/color";
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
  print(color.blue(color.bold(name)), color.blue(version as string), "\n");
  find(command)(flags);
};
