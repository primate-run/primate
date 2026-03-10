import create_root from "#create-root";
import init from "#init";
import frontend from "@primate/core/frontend";
import * as ts from "typescript";

export default frontend({
  ...init,
  root: {
    create: create_root,
  },
  css: {
    filter: /\.component\.(css)$/,
  },
  compile: {
    client: (text: string) => {
      const result = ts.transpileModule(text, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2020,
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          lib: ["es2020", "dom"],
          moduleResolution: ts.ModuleResolutionKind.NodeJs,
        },
      });

      // extract inline styles
      const style_match = text.match(/styles:\s*\[([\s\S]*?)\]/);

      return {
        js: result.outputText,
        css: style_match === null ? "" : style_match[1]
          .replace(/['"`]/g, "")
          .replace(/\\n/g, "\n")
          .trim(),
      };
    },

    server: (text: string) => {
      // TypeScript compilation for server (SSR)
      const result = ts.transpileModule(text, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2020,
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          lib: ["es2020"],
          moduleResolution: ts.ModuleResolutionKind.NodeJs,
        },
      });

      // hinder treeshaking
      return `import "@angular/compiler";\n${result.outputText}`;
    },
  },
});
