import FileRef from "@rcompat/fs/FileRef";
import root from "@rcompat/fs/project/root";

const load = async () => {
  try {
    return await root();
  } catch {
    return FileRef.resolve();
  }
};

// serve from build directory
export default async () => (await load()).join("./build/server.js").import();
