import App from "#App";
import build from "#hook/build";
import location from "#location";
import log from "#log";
import resolve_paths from "#paths";
import s_layout_depth from "#symbol/layout-depth";
import Build from "@rcompat/build";
import type FileRef from "@rcompat/fs/FileRef";
import cache from "@rcompat/kv/cache";
import type Dict from "@rcompat/type/Dict";
import type MaybePromise from "@rcompat/type/MaybePromise";

const s = Symbol("primate.Build");

type Loader = (source: string, file: FileRef) => MaybePromise<string>;
type Resolver = (basename: string, file: FileRef) => string;

export default class BuildApp extends App {
  frontends: Map<string, string[]> = new Map();
  conditions = new Set<string>();
  #postbuild: (() => void)[] = [];
  #roots: FileRef[] = [];
  #server_build: string[] = ["route"];
  #id = crypto.randomUUID().slice(0, 8);
  #i18n_active = false;
  #paths!: Dict<string[]>;

  async buildInit() {
    log.system("starting {0} build in {1} mode", this.target.name, this.mode);

    this.#paths = await resolve_paths(this.root, this.config("paths"));
    await build(this);
  }

  get id() {
    return this.#id;
  }

  get paths() {
    return this.#paths;
  }

  get frontendExtensions() {
    return [...this.frontends.values()].flat();
  }

  get build() {
    const conditions = this.conditions.values();

    return cache.get(s, () =>
      new Build({
        ...(this.config("build")),
        outdir: this.runpath(location.client).path,
        stdin: {
          contents: "",
          resolveDir: this.root.path,
        },
        conditions: ["style", "browser", "default", "module", ...conditions],
        resolveExtensions: [".ts", ".js", ...this.frontendExtensions],
        tsconfigRaw: {
          compilerOptions: {
            baseUrl: this.root.path,
            paths: this.#paths,
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

  async compile(
    directory: FileRef,
    context: string,
    options: {
      loader?: Loader;
      resolver?: Resolver;
    } = {},
  ) {
    if (!await directory.exists()) return;

    const files = await directory.collect(({ path }) =>
      this.extensions.some(e => path.endsWith(e)) && !path.endsWith(".d.ts"));

    for (const file of files) {
      await this.#compile_file(file, context, directory, options);
    }
  }

  async #compile_file(
    file: FileRef,
    context: string,
    directory: FileRef,
    options: {
      loader?: Loader;
      resolver?: Resolver;
    },
  ) {
    const binder = this.binder(file);
    if (binder === undefined) {
      log.info("no binder found for {0}", file.path);
      return;
    }

    // call the binder to compile
    const compiled = await binder(file, {
      build: { id: this.id, stage: this.runpath("stage") },
      context,
    });

    if (!compiled) {
      log.info("binder returned empty output for {0}", file.path);
      return;
    }

    // apply loader if provided
    const transformed = options.loader
      ? await options.loader(compiled, file)
      : compiled;

    const basename = this.basename(file, directory);
    const resolved = options.resolver
      ? options.resolver(basename, file)
      : basename;

    const target = this.runpath(context, `${resolved}.js`);

    // write to final location
    await target.directory.create({ recursive: true });
    await target.write(transformed);
  }

  depth(): number {
    return this.get<number>(s_layout_depth);
  }

  get i18n_active() {
    return this.#i18n_active;
  }

  set i18n_active(active: boolean) {
    this.#i18n_active = active;
  }
}
