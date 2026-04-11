import fs from "@rcompat/fs";
import runtime from "@rcompat/runtime";
import type Command from "./Command.js";

const load = async () => {
  try {
    return await runtime.projectRoot();
  } catch {
    return fs.resolve();
  }
};

const command_serve: Command = async () => {
  const outdir = runtime.flags.get("--outdir");
  return (await load()).join(`./${outdir}/server.js`).import();
};

// serve from build directory
export default command_serve;
