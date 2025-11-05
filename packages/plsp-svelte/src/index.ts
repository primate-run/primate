// packages/plsp-svelte/src/index.ts
import * as path from "path";
import { svelte2tsx } from "svelte2tsx";
import type * as ts from "typescript/lib/tsserverlibrary";

// tiny helpers (avoid internal TS APIs)
const normalize = (p: string) => p.replace(/\\/g, "/");
const resolveFrom = (containingFile: string, spec: string) =>
  normalize(path.isAbsolute(spec) ? spec : path.resolve(path.dirname(containingFile), spec));

function init(mods: { typescript: typeof import("typescript/lib/tsserverlibrary") }) {
  const ts = mods.typescript;

  function create(info: ts.server.PluginCreateInfo) {
    const log = (m: string) => info.project.projectService.logger.info(`[plsp] ${m}`);
    const host = info.languageServiceHost;

    log(`plugin loaded (cwd: ${info.project.getCurrentDirectory()})`);

    // Get the compiler options to access paths config
    const compilerOptions = info.project.getCompilerOptions();
    const projectDir = info.project.getCurrentDirectory();

    // DEBUG: Log the paths configuration
    log(`baseUrl: ${compilerOptions.baseUrl}`);
    log(`paths: ${JSON.stringify(compilerOptions.paths, null, 2)}`);
    log(`projectDir: ${projectDir}`);

    // Helper to resolve path mappings manually
    function resolvePathMapping(spec: string): string | undefined {
      log(`Trying to resolve: ${spec}`);

      if (!compilerOptions.paths || !compilerOptions.baseUrl) {
        log("No paths or baseUrl configured");
        return undefined;
      }

      const baseUrl = path.resolve(projectDir, compilerOptions.baseUrl);
      log(`Resolved baseUrl: ${baseUrl}`);

      for (const [pattern, substitutions] of Object.entries(compilerOptions.paths)) {
        log(`Checking pattern: ${pattern}`);

        // Convert pattern to regex (e.g., "#view/*" -> "^#view/(.*)$")
        const patternRegex = new RegExp(
          "^" + pattern.replace(/\*/g, "(.*)") + "$",
        );
        const match = spec.match(patternRegex);

        if (match) {
          log(`Pattern matched! Captured: ${match[1]}`);

          // Try each substitution
          for (const sub of substitutions) {
            let resolvedPath = sub;
            // Replace * with the captured group
            if (match[1]) {
              resolvedPath = resolvedPath.replace(/\*/g, match[1]);
            }

            const fullPath = normalize(path.resolve(baseUrl, resolvedPath));
            log(`Trying: ${fullPath}`);

            // Try exact match
            if (host.fileExists?.(fullPath)) {
              log(`Found exact match: ${fullPath}`);
              return fullPath;
            }

            // Try with .svelte extension
            const withSvelte = fullPath + ".svelte";
            log(`Trying with .svelte: ${withSvelte}`);
            if (host.fileExists?.(withSvelte)) {
              log(`Found with .svelte: ${withSvelte}`);
              return withSvelte;
            }
          }
        }
      }

      log(`No match found for ${spec}`);
      return undefined;
    }

    // 1) Treat .svelte as TSX
    const origGetScriptKind = host.getScriptKind?.bind(host);
    host.getScriptKind = (fileName: string) => {
      if (fileName.endsWith(".svelte")) return ts.ScriptKind.TSX;
      return origGetScriptKind ? origGetScriptKind(fileName) : ts.ScriptKind.Unknown;
    };

    // 2) Module resolution for "*.svelte"
    const origResolveLits = host.resolveModuleNameLiterals?.bind(host);
    if (origResolveLits) {
      host.resolveModuleNameLiterals = (
        moduleLiterals,
        containingFile,
        redirectedReference,
        options,
        containingSourceFile,
        reusedNames,
      ) => {
        const base = origResolveLits(
          moduleLiterals,
          containingFile,
          redirectedReference,
          options,
          containingSourceFile,
          reusedNames,
        );
        return base.map((res, i) => {
          const spec = moduleLiterals[i].text;

          // If base resolution succeeded and it's a .svelte file, mark as TSX
          if (res?.resolvedModule?.resolvedFileName.endsWith(".svelte")) {
            return {
              resolvedModule: {
                ...res.resolvedModule,
                extension: ts.Extension.Tsx,
              },
            };
          }

          // If base resolution failed, try our custom resolution
          if (!res?.resolvedModule) {
            // Try path mapping resolution
            const pathMapped = resolvePathMapping(spec);
            if (pathMapped) {
              log(`Resolved ${spec} to ${pathMapped} via path mapping`);
              return {
                resolvedModule: {
                  resolvedFileName: pathMapped,
                  extension: ts.Extension.Tsx,
                  isExternalLibraryImport: false,
                },
              };
            }

            // Handle explicit .svelte imports
            if (spec.endsWith(".svelte")) {
              const resolvedFileName = resolveFrom(containingFile, spec);
              if (host.fileExists?.(resolvedFileName)) {
                return {
                  resolvedModule: {
                    resolvedFileName,
                    extension: ts.Extension.Tsx,
                    isExternalLibraryImport: false,
                  },
                };
              }
            }

            // Try appending .svelte for extension-less imports
            const svelteFileName = resolveFrom(containingFile, spec + ".svelte");
            if (host.fileExists?.(svelteFileName)) {
              return {
                resolvedModule: {
                  resolvedFileName: svelteFileName,
                  extension: ts.Extension.Tsx,
                  isExternalLibraryImport: false,
                },
              };
            }
          }

          return res;
        });
      };
    } else {
      const origResolveNames = host.resolveModuleNames?.bind(host);
      host.resolveModuleNames = (
        moduleNames,
        containingFile,
        reusedNames,
        redirectedReference,
        options,
        containingSourceFile,
      ) => {
        const base = origResolveNames
          ? origResolveNames(moduleNames, containingFile, reusedNames, redirectedReference, options, containingSourceFile)
          : new Array(moduleNames.length).fill(undefined);
        return moduleNames.map((spec, i) => {
          // If base resolution succeeded and it's a .svelte file, mark as TSX
          if (base[i]?.resolvedFileName.endsWith(".svelte")) {
            return {
              ...base[i],
              extension: ts.Extension.Tsx,
            };
          }

          // If base resolution failed, try our custom resolution
          if (!base[i] && typeof spec === "string") {
            // Try path mapping resolution
            const pathMapped = resolvePathMapping(spec);
            if (pathMapped) {
              log(`Resolved ${spec} to ${pathMapped} via path mapping`);
              const rm: ts.ResolvedModuleFull = {
                resolvedFileName: pathMapped,
                extension: ts.Extension.Tsx,
                isExternalLibraryImport: false,
              };
              return rm;
            }

            // Handle explicit .svelte imports
            if (spec.endsWith(".svelte")) {
              const resolvedFileName = resolveFrom(containingFile, spec);
              if (host.fileExists?.(resolvedFileName)) {
                const rm: ts.ResolvedModuleFull = {
                  resolvedFileName,
                  extension: ts.Extension.Tsx,
                  isExternalLibraryImport: false,
                };
                return rm;
              }
            }

            // Try appending .svelte for extension-less imports
            const svelteFileName = resolveFrom(containingFile, spec + ".svelte");
            if (host.fileExists?.(svelteFileName)) {
              const rm: ts.ResolvedModuleFull = {
                resolvedFileName: svelteFileName,
                extension: ts.Extension.Tsx,
                isExternalLibraryImport: false,
              };
              return rm;
            }
          }

          return base[i];
        });
      };
    }

    // 3) Serve transformed TSX snapshots for *.svelte (use editor buffer)
    const origGetScriptSnapshot = host.getScriptSnapshot.bind(host);
    const origGetScriptVersion = host.getScriptVersion?.bind(host);
    const cache = new Map<string, { v: string; snap: ts.IScriptSnapshot }>();

    host.getScriptSnapshot = (fileName: string) => {
      if (fileName.endsWith(".svelte")) {
        const v = (origGetScriptVersion ? origGetScriptVersion(fileName) : "") || "0";
        const key = `${fileName}::${v}`;
        const hit = cache.get(key);
        if (hit) return hit.snap;

        const src = origGetScriptSnapshot(fileName);
        if (!src) return src;

        const text = src.getText(0, src.getLength());
        try {
          const { code } = svelte2tsx(text, {
            filename: path.basename(fileName),
            isTsFile: true,
          });

          // Extract $$ComponentProps with proper brace counting
          const typeStart = code.indexOf("type $$ComponentProps =");
          let exportCode = "";

          if (typeStart !== -1) {
            const afterEquals = typeStart + "type $$ComponentProps =".length;
            let braceCount = 0;
            let inType = false;
            let endPos = afterEquals;

            for (let i = afterEquals; i < code.length; i++) {
              const char = code[i];
              if (char === "{") {
                braceCount++;
                inType = true;
              } else if (char === "}") {
                braceCount--;
              } else if (char === ";" && braceCount === 0 && inType) {
                endPos = i;
                break;
              }
            }

            const propsType = code.substring(afterEquals, endPos).trim();
            exportCode = `
              type Props = ${propsType};
              const component: (props: Props) => any = null as any;
              export default component;
            `;
          } else {
            exportCode = `
              const component: (props: {}) => any = null as any;
              export default component;
            `;
          }

          const snap = ts.ScriptSnapshot.fromString(exportCode);
          cache.set(key, { v, snap });
          return snap;
        } catch (e: any) {
          log(`svelte2tsx error in ${fileName}: ${e?.message ?? e}`);
          return ts.ScriptSnapshot.fromString("export {}");
        }
      }
      return origGetScriptSnapshot(fileName);
    };

    // Return the original LS (no proxy, keeps tsserver stable)
    return info.languageService;
  }

  return { create };
}

export = init;
