import type { default as App, TargetHandler } from "#App";
import type Binder from "#build/Binder";
import type BindingContext from "#build/BindingContext";
import type { Config } from "#config";
import type Mode from "#Mode";
import module_loader from "#module-loader";
import assert from "@rcompat/assert";
import Build from "@rcompat/build";
import transform from "@rcompat/build/transform";
import FileRef from "@rcompat/fs/FileRef";
import type Path from "@rcompat/fs/Path";
import identity from "@rcompat/function/identity";
import cache from "@rcompat/kv/cache";
import entries from "@rcompat/record/entries";
import exclude from "@rcompat/record/exclude";
import get from "@rcompat/record/get";
import type MaybePromise from "@rcompat/type/MaybePromise";
import type PartialDictionary from "@rcompat/type/PartialDictionary";
import { web } from "./targets/index.js";

const ts_options = {
  loader: "ts",
  tsconfigRaw: {
    compilerOptions: {
      experimentalDecorators: true,
    },
  },
} as const;

const compile_typescript = async (code: string) =>
  (await transform(code, ts_options)).code;

export const symbols = {
  layout_depth: Symbol("layout.depth"),
};

const s = Symbol("primate.Build");

type ExtensionCompileFunction = (component: FileRef, app: BuildApp) =>
  Promise<void>;

type ExtensionCompile = {
  client: ExtensionCompileFunction;
  server: ExtensionCompileFunction;
};

export interface BuildApp extends App {
  bind: (extension: string, binder: Binder) => void;
  target: (name: string, target: TargetHandler) => void;
  postbuild: (() => void)[];
  bindings: PartialDictionary<Binder>;
  roots: FileRef[];
  targets: PartialDictionary<{ forward?: string; target: TargetHandler }>;
  assets: unknown[];
  extensions: PartialDictionary<ExtensionCompile>;
  stage: (source: FileRef, directory: Path,
    mapper?: (text: string) => MaybePromise<string>) => Promise<void>;
  stage2: (directory: FileRef, context: BindingContext,
    importer: (file: FileRef) => string) => Promise<void>;
  compile: (component: FileRef) => Promise<void>;
  register: (extension: string, compile: ExtensionCompile) => void;
  done: (fn: () => void) => void;
  server_build: string[];
  build_target: string;
  get build(): Build;
  depth(): number;
  get mode(): Mode;
};

type Default = (root: FileRef, config: Config, mode: Mode) => Promise<BuildApp>;

const build: Default = async (root, config, mode = "developement" as Mode) => {
  const path = entries(config.location).valmap(([, value]) => root.join(value))
    .get();
  const error = path.routes.join("+error.js");
  const kv_storage = new Map<symbol, unknown>();

  return {
    postbuild: [],
    bindings: {
      ".js": async (file, context) => {
        const contexts = ["routes", "stores", "config"];
        const _error = "js: only route, store and config files are supported";
        assert(contexts.includes(context), _error);

        await file.append(".js").write(await file.text());

      },
      ".ts": async (file, context) => {
        const contexts = ["routes", "stores", "config"];
        const _error = "ts: only route, store and config files are supported";
        assert(contexts.includes(context), _error);

        const code = await file.text();
        await file.append(".js").write(await compile_typescript(code));
      },
    },
    roots: [],
    targets: { web: { target: web } },
    assets: [],
    path,
    root,
    config: <P extends string>(key: P) => get(config, key),
    get mode() {
      return mode;
    },
    get<T>(key: symbol) {
      return kv_storage.get(key) as T;
    },
    set: (key, value) => {
      if (kv_storage.has(key)) {
        // throw erro
      }
      kv_storage.set(key, value);
    },
    error: {
      default: await error.exists() ? await error.import("default") : undefined,
    },
    extensions: {},
    modules: await module_loader(root, config.modules ?? []),
    async stage(source, directory, mapper = identity) {
      if (!await source.exists()) {
        return;
      }

      const target_base = this.runpath(directory.toString());

      await Promise.all((await source.collect(file => file.isFile()))
        .map(async abs => {
        const rel = FileRef.join(directory, abs.debase(source));
        const is_ts = abs.path.endsWith(".ts");
        const is_angular = abs.path.endsWith(".component.ts");
        let text = await mapper(await abs.text());
        if (is_ts) {
          text = await compile_typescript(text);
        }

        const base = abs.base;
        const extension = abs.extension;
        const outdir = target_base.join(rel.debase(directory)).directory;
        await outdir.create();

        const e = is_angular ? ".ts" : is_ts ? ".js" : extension;
        const outfile = outdir.join(base.concat(e));
        await outfile.write(text);
      }));
    },
    async stage2(directory, context, importer) {
      if (!await directory.exists()) {
        return;
      }
      if (!await this.runpath("stage").exists()) {
        await this.runpath("stage").create();
      }
      const base = this.runpath("stage", context);
      if (!await base.exists()) {
        await base.create();
      }
      const build_directory = this.runpath(directory.name);
      await build_directory.create();
      for (const file of await directory.collect(({ path }) => /^.*$/.test(path))) {
        const debased = file.debase(directory);

        const target = base.join(debased);
        await target.directory.create({
          recursive: true,
        });

        if (!this.bindings[file.fullExtension]) {
          continue;
        }

        // copy to build/stage/${directory}
        await file.copy(target);
        await this.bindings[file.fullExtension]?.(target, context);

        // actual
        const runtime_file = build_directory.join(debased.bare(".js"));
        await runtime_file.directory.create();
        runtime_file.write(importer(debased));
      }
    },
    async compile(component) {
      const { server, client, components } = this.config("location");

      const compile = this.extensions[component.fullExtension]
        ?? this.extensions[component.extension];
      if (compile === undefined) {
        const source = this.path.build.join(components);
        const debased = `${component.path}`.replace(source.toString(), "");

        const server_target = this.runpath(server, components, debased);
        await server_target.directory.create();
        await component.copy(server_target);

        const client_target = this.runpath(client, components, debased);
        await client_target.directory.create();
        await component.copy(client_target);
      } else {
        // compile server components
        await compile.server(component, this);

        // compile client components
        await compile.client(component, this);
      }
    },
    register(extension, compile) {
      this.extensions[extension] = compile;
    },
    runpath(...directories) {
      return this.path.build.join(...directories);
    },
    bind(extension, binder) {
      if (this.bindings[extension] !== undefined) {
        throw new Error(`${extension} already bound`);
      }
      this.bindings[extension] = binder;
    },
    target(name, target) {
      this.targets[name] = { target };
    },
    done(fn) {
      this.postbuild.push(fn);
    },
    server_build: ["route"],
    build_target: "web",
    get build() {
      return cache.get(s, () =>
        new Build({
          ...exclude(this.config("build"), ["includes"]),
          outdir: this.runpath(this.config("location.client")).path,
          stdin: {
            contents: "",
            resolveDir: this.root.path,
          },
        }, mode === "development" ? "development" : "production"),
      );
    },
    depth() {
      return this.get<number>(symbols.layout_depth);
    },
  } as const satisfies BuildApp;
};

export default build;
