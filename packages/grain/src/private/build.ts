import assert from "@rcompat/invariant/assert";
import execute from "@rcompat/stdio/execute";
import FileRef from "@rcompat/fs/FileRef";
import type { BuildAppHook } from "@primate/core/hook";
import which from "@rcompat/stdio/which";

let command: string | null = null;
let grainIncludeDir: FileRef | null = null;
let postludeRef: FileRef | null = null;

const compileGrainFile = (wasm: FileRef, grain: FileRef) =>
  `${command} compile -o ${wasm.name} ${grain.name} -I ${grainIncludeDir}`;

export default (extension: string): BuildAppHook => (app, next) => {
  
  app.bind(extension, async (grain, context) => {
    const importGrainRegex = /(\n|\r\n|^)from "primate" include Primate(\n|\r\n|$)/;
    command ||= await which("grain");
    grainIncludeDir ||= await FileRef.join(import.meta.url, "include");
    postludeRef ||= await FileRef.join(import.meta.url, "postlude.gr");

    assert(context === "routes", "grain: only route files are supported");
    
    // TODO: 1. Get module text
    //       2. Assert `(\n|\r\n|^)from "primate" include Primate(\n|\r\n|$)` exists
    
    const code = await grain.text();
    const postlude = await postludeRef.text();
    
    const outputGrain = importGrainRegex.test(code)
      ? `${code}\n${postlude}`
      : `${code}\nfrom "primate" include Primate\n${postlude}`;
    await grain.write(outputGrain);
    const wasm = grain.bare(".wasm");
    await execute(compileGrainFile(wasm, grain), { cwd: `${grain.directory}` });

  });

  return next(app);
};