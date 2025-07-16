import AppError from "#AppError";
import type Binder from "#Binder";
import type Config from "#config/Config";
import location from "#location";
import log from "#log";
import type Mode from "#Mode";
import type Module from "#module/Module";
import type RouteFunction from "#RouteFunction";
import assert from "@rcompat/assert";
import transform from "@rcompat/build/sync/transform";
import type FileRef from "@rcompat/fs/FileRef";
import entries from "@rcompat/record/entries";
import get from "@rcompat/record/get";
import type PartialDict from "@rcompat/type/PartialDict";

const ts_options = {
  loader: "ts",
  tsconfigRaw: {
    compilerOptions: {
      experimentalDecorators: true,
    },
  },
} as const;

const compile = (code: string) => transform(code, ts_options).code;

const default_bindings: PartialDict<Binder> = {
  ".js": async (file, context) => {
    const contexts = ["routes", "stores", "config"];
    const error = "js: only route, store and config files are supported";
    assert(contexts.includes(context), error);

    await file.append(".js").write(await file.text());

  },
  ".ts": async (file, context) => {
    const contexts = ["routes", "stores", "config"];
    const error = "ts: only route, store and config files are supported";
    assert(contexts.includes(context), error);

    await file.append(".js").write(compile(await file.text()));
  },
};

const reducer = async <A extends App>(modules: Module[], app: A): Promise<A> => {
  if (modules.length === 0) {
    return app;
  }
  const [first, ...rest] = modules;

  if (rest.length === 0) {
    return await first.init(app, _ => _);
  };
  return await first.init(app, _ => reducer(rest, _));
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
  #bindings = {...default_bindings};

  constructor(root: FileRef, config: Config, mode: Mode) {
    this.#root = root;
    this.#config = config;
    this.#modules = config.modules?.flat(10) ?? [];
    this.#path = entries(location).valmap(([, path]) => root.join(path)).get();
    this.#mode = mode;
  }

  async init() {
    const error = this.#path.routes.join("+error.js");

    this.#defaultErrorRoute = await error.exists()
      ? await error.import("default") as RouteFunction
      : undefined;

    const names = this.#modules.map(({ name }) => name);
    if (new Set(names).size !== this.#modules.length) {
      throw new AppError("module {0} loaded twice", doubled(names));
    }

    return await reducer(this.#modules, this);
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

  get bindings() {
    return {...this.#bindings};
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
    if (this.#bindings[extension] !== undefined) {
      throw new Error(`${extension} already bound`);
    }
    this.#bindings[extension] = binder;
  }
}
