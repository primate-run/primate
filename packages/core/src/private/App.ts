import type BuildApp from "#build/App";
import type Config from "#config/Config";
import E from "#errors";
import type Flags from "#Flags";
import location from "#location";
import type Mode from "#Mode";
import type { Created, Hooks } from "#module/create";
import create from "#module/create";
import type ServeApp from "#serve/App";
import TargetManager from "#target/Manager";
import dict from "@rcompat/dict";
import type { FileRef } from "@rcompat/fs";
import p from "pema";

export default class App {
  #path: { [K in keyof typeof location]: FileRef } & { build: FileRef };
  #root: FileRef;
  #config: Config;
  #hooks: Hooks = {
    init: [],
    build: [],
    serve: [],
    handle: [],
    route: [],
  };
  #module_names = new Set<string>();
  #kv = new Map<symbol, unknown>();
  #mode: Mode;
  #target: TargetManager;
  #target_name: string;

  constructor(root: FileRef, config: Config, flags: typeof Flags.infer) {
    if (Object.values(location).includes(flags.dir as any)) {
      throw E.app_reserved_directory(flags.dir);
    }
    this.#root = root;
    this.#config = config;
    for (const module of config.modules) this.register(create(module));
    this.#path = dict.map({
      ...location,
      build: flags.dir,
    }, (_, path) => root.join(path));
    this.#mode = flags.mode;
    this.#target = new TargetManager(this);
    this.#target_name = flags.target;
  }

  async init() {
    for (const hook of this.#hooks.init) await hook(this);

    this.#target.set(this.#target_name);

    return this;
  }

  register(created: Created) {
    if (this.#module_names.has(created.name)) {
      throw E.app_duplicate_module(created.name);
    }
    this.#module_names.add(created.name);
    this.#hooks.init.push(...created.hooks.init);
    this.#hooks.build.push(...created.hooks.build);
    this.#hooks.serve.push(...created.hooks.serve);
    this.#hooks.handle.push(...created.hooks.handle);
    this.#hooks.route.push(...created.hooks.route);
  }

  async build_hooks(app: BuildApp) {
    for (const hook of this.#hooks.build) await hook(app);

    return app;
  }

  async serve_hooks(app: ServeApp) {
    for (const hook of this.#hooks.serve) await hook(app);

    return app;
  }

  get handle_hooks() {
    return [...this.#hooks.handle];
  }

  get route_hooks() {
    return [...this.#hooks.route];
  }

  get location() {
    return { ...location };
  }

  get target() {
    return this.#target;
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

  get livereload() {
    const {
      host = this.config("http.host"),
      port = p.uint.port().parse(this.config("http.port") - 1),
    } = this.config("livereload");

    return { host, port };
  }

  get<T>(key: symbol) {
    return this.#kv.get(key) as T;
  }

  set(key: symbol, value: unknown) {
    this.#kv.set(key, value);
  }

  config<P extends string>(path: P) {
    return dict.get(this.#config, path);
  }

  runpath(...directories: string[]): FileRef {
    return this.#path.build.join(...directories);
  }
}
