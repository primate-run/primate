import assert from "@rcompat/invariant/assert";
import execute from "@rcompat/stdio/execute";
import FileRef from "@rcompat/fs/FileRef";
import type { BuildAppHook } from "@primate/core/hook";
import type GrainConfiguration from "../GrainConfig.ts";

let postludeRef: FileRef | null = null;
let grainExports: FileRef | null = null;
let grainBootstrap: FileRef | null = null;

export default (config: GrainConfiguration): BuildAppHook => (app, next) => {
  const compileGrainFile = (wasm: FileRef, grain: FileRef) => {
    const commandSections = [
      config.command,
      "compile",
      "-o", wasm.name,
      grain.name,
      "-I", config.grainIncludeDirs.join(","),
      "--dir", ".",
    ] as string[];

    if (config.grainStdLib) {
      commandSections.push("-S", config.grainStdLib);
    }

    if (app.mode === "development") {
      commandSections.push("--debug", "--source-map", "--wat");
    }

    if (app.mode === "production") {
      commandSections.push("--release");
    }

    if (config.noPervasives) {
      commandSections.push("--no-pervasives");
    }

    if (config.strictSequence) {
      commandSections.push("--strict-sequence");
    }



    return commandSections.join(" ");
  }
  
  app.bind(config.extension, async (grain, context) => {
    postludeRef ||= FileRef.join(import.meta.dirname, "bootstrap", "postlude.gr");
    grainExports ||= FileRef.join(import.meta.dirname, "exports.gr");
    grainBootstrap ||= FileRef.join(import.meta.dirname, "bootstrap", "index.js");

    assert(context === "routes", "grain: only route files are supported");
    
    const code = await grain.text();
    const postlude = await postludeRef.text();
    
    await grain.write(`${code}\n${postlude}`);
    const wasm = grain.bare(".wasm");
    const commandText = compileGrainFile(wasm, grain);

    await execute(commandText, { cwd: `${grain.directory}` });

    const bootstrapFile = grain.bare(".gr.js");
    const bootstrapCode = (await grainBootstrap.text()).replace("__FILE_NAME__", wasm.path);
    await bootstrapFile.write(bootstrapCode);
  });

  return next(app);
};