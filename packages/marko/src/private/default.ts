import create_root from "#create-root";
import init from "#init";
import { compileSync } from "@marko/compiler";
import frontend from "@primate/core/frontend";
import type { FileRef } from "@rcompat/fs";

function resolveVirtualDependency(
  _from: string,
  dep: { virtualPath: string; code: string },
) {
  return dep.virtualPath;
}

function filename(file: FileRef, root: boolean) {
  return root || file.path.startsWith("root:")
    ? "/tmp/primate-marko-root.marko"
    : file.path;
}

function compile(
  text: string,
  file: FileRef,
  output: "html" | "dom",
  root = false,
) {
  return compileSync(text, filename(file, root), {
    output,
    resolveVirtualDependency,
  });
}

function domRuntime(js: string) {
  return js.includes(`from "marko/debug/dom"`)
    ? "marko/debug/dom"
    : "marko/dom";
}

export default frontend({
  ...init,
  root: {
    create: create_root,
  },
  compile: {
    server: (text: string, file: FileRef) => {
      return compile(text, file, "html").code;
    },
    client: (text: string, file: FileRef, root: boolean, hydrate: boolean) => {
      const compiled = compile(text, file, "dom", root);
      let js = compiled.code;

      if (hydrate) {
        const id = (compiled.meta as { id: string }).id;
        const runtime = domRuntime(js);

        js += `
import { initEmbedded as __primate_marko_init } from ${JSON.stringify(runtime)};
__primate_marko_init(${JSON.stringify(id)});
`;
      }

      return { js };
    },
  },
});
