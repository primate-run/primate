import create_root from "#create-root";
import init from "#init";
import signal_inputs from "#signal-inputs";
import frontend from "@primate/core/frontend";
import ts from "typescript";

function compile(text: string, lib: string[]) {
  const result = ts.transpileModule(signal_inputs(text), {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
      lib,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
    },
  });

  const style_match = text.match(/styles:\s*\[([\s\S]*?)\]/);

  return {
    js: result.outputText,
    css: style_match === null ? "" : style_match[1]
      .replace(/['"`]/g, "")
      .replace(/\\n/g, "\n")
      .trim(),
  };
}

export default frontend({
  ...init,
  root: {
    create: create_root,
  },
  css: {
    filter: /\.component\.(css)$/,
  },
  compile: {
    client: (text: string) => compile(text, ["es2020", "dom"]),
    server: (text: string) => {
      const result = compile(text, ["es2020"]);
      return `import "@angular/compiler";\n${result.js}`;
    },
  },
});
