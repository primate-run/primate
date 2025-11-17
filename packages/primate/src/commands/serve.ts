import FileRef from "@rcompat/fs/FileRef";
import root from "@rcompat/fs/project/root";
import get_flag from "./get-flag.js";

const load = async () => {
  try {
    return await root();
  } catch {
    return FileRef.resolve();
  }
};

// serve from build directory
export default async function app(flags: string[] = []) {
  const dir = get_flag(flags, "dir") ?? "build";
  return (await load()).join(`./${dir}/server.js`).import();
}
