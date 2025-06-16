import build from "#build";
import default_extension from "#extension";
import pkgname from "#pkgname";
import which from "@rcompat/stdio/which";
import FileRef from "@rcompat/fs/FileRef";
import type GrainConfiguration from "./GrainConfig.ts";



export default async (props: Partial<GrainConfiguration> = {} as Partial<GrainConfiguration>) => {
  const includeDirs = new Set(props.grainIncludeDirs ?? []);
  includeDirs.add(FileRef.join(import.meta.dirname, "private", "include").path);

  const effectiveConfig: GrainConfiguration = {
    extension: props.extension ?? default_extension,
    command: props.command ?? await which("grain"),
    grainIncludeDirs: Array.from(includeDirs),
    noPervasives: props.noPervasives ?? false,
    strictSequence: props.strictSequence ?? false,
  };

  if (props.grainStdLib) {
    effectiveConfig.grainStdLib = props.grainStdLib;
  }

  return {
    name: pkgname,
    build: build(effectiveConfig),
  };
} 
  
