import App from "#App";
import type Binder from "#Binder";
import build from "#hook/build";
import location from "#location";
import log from "#log";
import resolve_paths from "#paths";
import s_layout_depth from "#symbol/layout-depth";
import assert from "@rcompat/assert";
import Build from "@rcompat/build";
import transform from "@rcompat/build/sync/transform";
import type FileRef from "@rcompat/fs/FileRef";
import cache from "@rcompat/kv/cache";
import type Dict from "@rcompat/type/Dict";
import type MaybePromise from "@rcompat/type/MaybePromise";

const ts_options = {
  loader: "ts",
  tsconfigRaw: {
    compilerOptions: {
      experimentalDecorators: true,
    },
  },
} as const;
const compile = (code: string) => transform(code, ts_options).code;

const toContextString = (array: string[]) => array
  .map(member => member.endsWith("s") ? member.slice(0, -1) : member)
  .join(", ");

const BIND_CONTEXTS = [
  "config",
  "routes",
  "components",
  "views",
  "stores",
  "locales",
  "modules",
];
const s = Symbol("primate.Build");

const generate_bindings: Dict<Binder> = {
  ".js": (file, { context }) => {
    const error = `js: only ${toContextString(BIND_CONTEXTS)} are supported`;
    assert(BIND_CONTEXTS.includes(context), error);
    return file.text();
  },
  ".json": (file) => {
    // just copy the JSON for now
    return file.text();
  },
  ".ts": async (file, { context }) => {
    const error = `ts: only ${toContextString(BIND_CONTEXTS)} are supported`;
    assert(BIND_CONTEXTS.includes(context), error);

    return compile(await file.text());
  },
};
type Loader = (source: string, file: FileRef) => MaybePromise<string>;
type Resolver = (basename: string, file: FileRef) => string;

export default class BuildApp extends App {
  frontends: Map<string, string[]> = new Map();
  conditions = new Set<string>();
  #postbuild: (() => void)[] = [];
  #roots: FileRef[] = [];
  #server_build: string[] = [];
  #id = crypto.randomUUID().slice(0, 8);
  #i18n_active = false;
  #paths!: Dict<string[]>;
  #bindings: [string, Binder][] = Object.entries(generate_bindings);

  async buildInit() {
    log.system("starting {0} build in {1} mode", this.target.name, this.mode);

    this.#paths = await resolve_paths(this.root, this.config("paths"));
    await build(this);
  }

  get extensions() {
    return this.#bindings.map(([extension]) => extension);
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

  binder(file: FileRef) {
    return this.#bindings
      .toSorted(([a], [b]) => a.length > b.length ? -1 : 1)
      .find(([extension]) => file.path.endsWith(extension))
      ?.[1]
      ;
  }

  bind(extension: string, binder: Binder) {
    if (this.extensions.includes(extension)) {
      throw new Error(`${extension} already bound`);
    }
    this.#bindings.push([extension, binder]);
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

  basename(file: FileRef, directory: FileRef) {
    const relative = file.debase(directory);
    const extensions = this.extensions
      .toSorted((a, b) => a.length > b.length ? -1 : 1);
    for (const extension of extensions) {
      if (relative.path.endsWith(extension)) {
        return relative.path.slice(1, -extension.length);
      }
    }
    return relative.bare().path.slice(1);
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
