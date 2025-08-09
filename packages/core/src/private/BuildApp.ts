import App from "#App";
import type BindingContext from "#BindingContext";
import build from "#hook/build";
import location from "#location";
import log from "#log";
import s_layout_depth from "#symbol/layout-depth";
import Build from "@rcompat/build";
import type FileRef from "@rcompat/fs/FileRef";
import cache from "@rcompat/kv/cache";
import type PartialDict from "@rcompat/type/PartialDict";

const s = Symbol("primate.Build");

type ExtensionCompileFunction = (component: FileRef, app: BuildApp)
  => Promise<void>;

type ExtensionCompile = {
  client: ExtensionCompileFunction;
  server: ExtensionCompileFunction;
};

export default class BuildApp extends App {
  frontends: Map<string, string> = new Map();
  #postbuild: (() => void)[] = [];
  #extensions: PartialDict<ExtensionCompile> = {};
  #roots: FileRef[] = [];
  #server_build: string[] = ["route"];
  #id = crypto.randomUUID().slice(0, 8);

  async buildInit() {
    log.system("starting {0} build in {1} mode", this.platform.name, this.mode);
    await build(this);
  }

  get id() {
    return this.#id;
  }

  get build() {
    return cache.get(s, () =>
      new Build({
        ...(this.config("build")),
        outdir: this.runpath(location.client).path,
        stdin: {
          contents: "",
          resolveDir: this.root.path,
        },
        tsconfigRaw: {
          compilerOptions: {
            baseUrl: "${configDir}",
            paths: {
              "#component/*": [
                "components/*",
                ...[...this.frontends.values()]
                  .map(extension => `components/*${extension}`),
              ],
              "#static/*": [
                "./static/*.js", "./static/*.ts",
              ],
            },
          },
        },
      }, this.mode === "development" ? "development" : "production"),
    );
  }

  get server_build() {
    return this.#server_build;
  }

  addRoot(root: FileRef) {
    this.#roots.push(root);
  }

  get roots() {
    return [...this.#roots];
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
      if (!await target.directory.exists()) {
        await target.directory.create({ recursive: true });
      }

      if (!this.bindings[file.fullExtension]) {
        continue;
      }

      // copy to build/stage/${directory}
      await file.copy(target);
      await this.bindings[file.fullExtension]?.(target, {
        build: { id: this.id, stage: this.runpath("stage") },
        context,
      });

      // actual
      const runtime_file = build_directory.join(debased.bare(".js"));
      await runtime_file.directory.create();
      runtime_file.write(importer(debased));
    }
  }

  async compile(component: FileRef) {
    const { client, components, server } = location;

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
