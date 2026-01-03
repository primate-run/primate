import fs from "@rcompat/fs";
import get_flag from "./get-flag.js";

const load = async () => {
  try {
    return await fs.project.root();
  } catch {
    return fs.resolve();
  }
};

// serve from build directory
export default async function app(flags: string[] = []) {
  const dir = get_flag(flags, "dir") ?? "build";
  return (await load()).join(`./${dir}/server.js`).import();
}
