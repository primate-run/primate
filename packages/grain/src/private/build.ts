import assert from "@rcompat/invariant/assert";
import execute from "@rcompat/stdio/execute";
import FileRef from "@rcompat/fs/FileRef";
import type { BuildAppHook } from "@primate/core/hook";
import which from "@rcompat/stdio/which";

let command: string | null = null;
let grainIncludeDir: FileRef | null = null;
let postludeRef: FileRef | null = null;
let grainExports: FileRef | null = null;
let grainBootstrap: FileRef | null = null;

const compileGrainFile = (wasm: FileRef, grain: FileRef) =>
  `${command} compile -o ${wasm.name} ${grain.name} -I ${grainIncludeDir}`;

export default (extension: string): BuildAppHook => (app, next) => {
  
  app.bind(extension, async (grain, context) => {
    command ||= await which("grain");
    postludeRef ||= FileRef.join(import.meta.dirname, "postlude.gr");
    grainIncludeDir ||= FileRef.join(import.meta.dirname, "include");
    grainExports ||= FileRef.join(import.meta.dirname, "exports.gr");
    grainBootstrap ||= FileRef.join(import.meta.dirname, "bootstrap", "index.ts");

    assert(context === "routes", "grain: only route files are supported");
    
    const code = await grain.text();
    const postlude = await postludeRef.text();
    
    await grain.write(`${code}\n${postlude}`);

    const wasm = grain.bare(".wasm");
    await execute(compileGrainFile(wasm, grain), { cwd: `${grain.directory}` });

    const bootstrapFile = grain.bare(".ts");
    const bootstrapCode = (await grainBootstrap.text()).replace("__FILE_NAME__", bootstrapFile.name);
    await bootstrapFile.write(bootstrapCode);
  });

  return next(app);
};