import App from "#App";
import type BindingContext from "#BindingContext";
import build from "#hook/build";
import location from "#location";
import log from "#log";
import s_layout_depth from "#symbol/layout-depth";
import web from "#targets/web";
import Build from "@rcompat/build";
import transform from "@rcompat/build/sync/transform";
import FileRef from "@rcompat/fs/FileRef";
import type Path from "@rcompat/fs/Path";
import identity from "@rcompat/function/identity";
import cache from "@rcompat/kv/cache";
import exclude from "@rcompat/record/exclude";
import type MaybePromise from "@rcompat/type/MaybePromise";
import type PartialDict from "@rcompat/type/PartialDict";
import assert from "@rcompat/assert";

const ts_options = {
  loader: "ts",
  tsconfigRaw: {
    compilerOptions: {
      experimentalDecorators: true,
    },
  },
} as const;

const s = Symbol("primate.Build");

const compile = (code: string) => transform(code, ts_options).code;

type TargetHandler = (app: BuildApp) => MaybePromise<void>;
type Target = { forward?: string; target: TargetHandler };

type ExtensionCompileFunction = (component: FileRef, app: BuildApp)
=> Promise<void>;

type ExtensionCompile = {
  client: ExtensionCompileFunction;
  server: ExtensionCompileFunction;
};

export default class BuildApp extends App {
  #frontends: Set<string> = new Set();
  #targets: PartialDict<Target> = { web: { target: web } };
  #postbuild: (() => void)[] = [];
  #extensions: PartialDict<ExtensionCompile> = {};
  #roots: FileRef[] = [];
  #server_build: string[] = ["route"];
  #target: string = "web";

  get frontends() {
    return [...this.#frontends.values()];
  }

  get build() {
    return cache.get(s, () =>
      new Build({
        ...exclude(this.config("build"), ["includes", "options"]),
        ...(this.config("build.options") ?? {}),
        outdir: this.runpath(location.client).path,
        tsconfigRaw: {
          compilerOptions: {
            baseUrl: "${configDir}",
            paths: {
              "#component/*": ["components/*"],
            },
          },
        },
        stdin: {
          contents: "",
          resolveDir: this.root.path,
        },
      }, this.mode === "development" ? "development" : "production"),
    );
  }

  get server_build() {
    return this.#server_build;
  }

  get targets() {
    return {...this.#targets};
  }

  addRoot(root: FileRef) {
    this.#roots.push(root);
  }

  get roots() {
    return [...this.#roots];
  }

  frontend(name: string) {
    this.#frontends.add(name);
  }

  async runTarget() {
    await this.targets[this.#target]?.target(this);
  }

  async initBuild(target: string) {
    await this.init();

    this.#target = target;
    if (this.targets[target]?.forward !== undefined) {
      this.#target = this.targets[target].forward;
    }
    log.system("starting {0} build in {1} mode", target, this.mode);
    return await build(this);
  }

  target(name: string, target: TargetHandler) {
    this.#targets[name] = { target };
  }

  done(fn: () => void) {
    this.#postbuild.push(fn);
  }

  cleanup() {
    this.#postbuild.forEach(fn => fn());
  }

  export(code: string) {
    this.build.export(code);
  }

  async stage(directory: FileRef, context: BindingContext,
    importer: (file: FileRef) => string) {
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
      if (!await directory.exists()) {
        await target.directory.create({ recursive: true });
      }

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
  }

  async compile(component: FileRef) {
    const { server, client, components } = location;

    const compile = this.#extensions[component.fullExtension]
      ?? this.#extensions[component.extension];
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
  }

  register(extension: string, compile: ExtensionCompile) {
    this.#extensions[extension] = compile;
  }

  depth(): number {
    return this.get<number>(s_layout_depth);
  }
}
