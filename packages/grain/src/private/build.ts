import type { BuildAppHook } from "@primate/core/hook";
import which from "@rcompat/stdio/which";
import assert from "@rcompat/invariant/assert";
import FileRef from "@rcompat/fs/FileRef";

const command = await which("grain");
const grainIncludeDir = FileRef.join(import.meta.dirname, "include");



const run = (wasm: FileRef, grain: FileRef) =>
  `${command} build -o ${wasm.name} ${grain.name} -I ${grainIncludeDir}`;

export default (extension: string): BuildAppHook => (app, next) => {
  app.bind(extension, async (grain, context) => {
    assert(context === "routes", "grain: only route files are supported");
    
    
    

  });

  return next(app);
};