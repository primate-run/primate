import type Config from "#config/Config";
import fail from "#fail";
import type Flags from "#Flags";
import location from "#location";
import type Mode from "#Mode";
import type Module from "#Module";
import reducer from "#reducer";
import TargetManager from "#target/Manager";
import type FileRef from "@rcompat/fs/FileRef";
import entries from "@rcompat/record/entries";
import get from "@rcompat/record/get";

const doubled = (set: string[]) =>
  set.find((part: string, i: number, array: string[]) =>
    array.filter((_, j) => i !== j).includes(part)) ?? "";

export default class App {
  #path: { [K in keyof typeof location]: FileRef } & { build: FileRef };
  #root: FileRef;
  #config: Config;
  #modules: Module[];
  #kv = new Map<symbol, unknown>();
  #mode: Mode;
  #target: TargetManager;
  #target_name: string;

  constructor(root: FileRef, config: Config, flags: typeof Flags.infer) {
    if (Object.values(location).includes(flags.dir as any)) {
      throw fail("cannot build to {0} - reserved directory", flags.dir);
    }
    this.#root = root;
    this.#config = config;
    this.#modules = config.modules?.flat(10) ?? [];
    this.#path = entries({
      ...location,
      build: flags.dir,
    }).valmap(([, path]) => root.join(path)).get();
    this.#mode = flags.mode;
    this.#target = new TargetManager(this);
    this.#target_name = flags.target;
  }

  async init() {
    const names = this.#modules.map(({ name }) => name);
    if (new Set(names).size !== this.#modules.length) {
      throw fail("module {0} loaded twice", doubled(names));
    }

    const app = await reducer(this.#modules, this, "init");

    this.#target.set(this.#target_name);

    return app;
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

  get modules() {
    return [...this.#modules];
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
}
