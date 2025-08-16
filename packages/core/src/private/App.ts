import AppError from "#AppError";
import type Binder from "#Binder";
import type Config from "#config/Config";
import location from "#location";
import type Mode from "#Mode";
import type Module from "#Module";
import PlatformManager from "#platform/Manager";
import reducer from "#reducer";
import wrap from "#route/wrap";
import type RouteFunction from "#RouteFunction";
import assert from "@rcompat/assert";
import transform from "@rcompat/build/sync/transform";
import type FileRef from "@rcompat/fs/FileRef";
import entries from "@rcompat/record/entries";
import get from "@rcompat/record/get";
import type Dict from "@rcompat/type/Dict";

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

const default_bindings: Dict<Binder> = {
  ".js": async (file, { build, context }) => {
    const contexts = ["routes", "stores", "config", "components", "modules"];
    const error = `js: only ${toContextString(contexts)} are supported`;
    assert(contexts.includes(context), error);
    const code = context === "routes"
      ? wrap(await file.text(), file, build)
      : await file.text();

    await file.append(".js").write(code);

  },
  ".json": () => {
    // just copy the JSON for now
  },
  ".ts": async (file, { build, context }) => {
    const contexts = ["routes", "stores", "config", "components", "modules"];
    const error = `ts: only ${toContextString(contexts)} are supported`;
    assert(contexts.includes(context), error);

    const code = context === "routes"
      ? wrap(compile(await file.text()), file, build)
      : compile(await file.text());
    await file.append(".js").write(code);
  },
};

const doubled = (set: string[]) =>
  set.find((part: string, i: number, array: string[]) =>
    array.filter((_, j) => i !== j).includes(part)) ?? "";

export default class App {
  #path: { [K in keyof typeof location]: FileRef };
  #root: FileRef;
  #config: Config;
  #modules: Module[];
  #kv = new Map<symbol, unknown>();
  #mode: Mode;
  #defaultErrorRoute: RouteFunction | undefined;
  #bindings: [string, Binder][] = Object.entries(default_bindings);
  #platform: PlatformManager;

  constructor(root: FileRef, config: Config, mode: Mode) {
    this.#root = root;
    this.#config = config;
    this.#modules = config.modules?.flat(10) ?? [];
    this.#path = entries(location).valmap(([, path]) => root.join(path)).get();
    this.#mode = mode;
    this.#platform = new PlatformManager(this);
  }

  async init(platform: string) {
    const error = this.#path.routes.join("+error.js");

    this.#defaultErrorRoute = await error.exists()
      ? await error.import("default") as RouteFunction
      : undefined;

    const names = this.#modules.map(({ name }) => name);
    if (new Set(names).size !== this.#modules.length) {
      throw new AppError("module {0} loaded twice", doubled(names));
    }

    const app = await reducer(this.#modules, this, "init");

    this.#platform.set(platform);

    return app;
  }

  get location() {
    return { ...location };
  }

  get platform() {
    return this.#platform;
  }

  get root() {
    return this.#root;
  }

  get path() {
    return this.#path;
  }

  get mode() {
    return this.#mode;
  }

  get modules() {
    return [...this.#modules];
  }

  get defaultErrorRoute() {
    return this.#defaultErrorRoute;
  }

  get extensions() {
    return this.#bindings.map(([extension]) => extension);
  }

  binder(file: FileRef) {
    return this.#bindings
      .toSorted(([a], [b]) => a.length > b.length ? -1 : 1)
      .find(([extension]) => file.path.endsWith(extension))
      ?.[1]
      ;
  }

  get<T>(key: symbol) {
    return this.#kv.get(key) as T;
  }

  set(key: symbol, value: unknown) {
    this.#kv.set(key, value);
  }

  config<P extends string>(path: P): ReturnType<typeof get<Config, P>> {
    return get(this.#config, path);
  }

  runpath(...directories: string[]): FileRef {
    return this.#path.build.join(...directories);
  }

  // this is technically not necessary for serving, but it has to be used by
  // the init hook, which is shared between the build and serve app
  bind(extension: string, binder: Binder) {
    if (this.extensions.includes(extension)) {
      throw new Error(`${extension} already bound`);
    }
    this.#bindings.push([extension, binder]);
  }
}
