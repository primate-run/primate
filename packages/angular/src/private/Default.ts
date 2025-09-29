import create_root from "#create-root";
import Runtime from "#Runtime";
import { enableProdMode } from "@angular/core";
import type NextServe from "@primate/core/NextServe";
import type ServeApp from "@primate/core/ServeApp";
import * as ts from "typescript";

export default class Default extends Runtime {
  root = {
    create: create_root,
  };

  css = {
    filter: /\.component\.(css)$/,
  };

  compile = {
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

      const styleMatch = text.match(/styles:\s*\[([\s\S]*?)\]/);

      let css = "";
      if (styleMatch) {
        // Extract and process inline styles
        css = styleMatch[1]
          .replace(/['"`]/g, "")
          .replace(/\\n/g, "\n")
          .trim();
      }

      return {
        js: result.outputText,
        css,
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
  };

  async serve(app: ServeApp, next: NextServe) {
    app.mode === "production" && enableProdMode();

    return super.serve(app, next);
  }
}
