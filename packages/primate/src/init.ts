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
  find(command)(flags);
};
