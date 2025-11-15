import type Config from "#config/Config";
import fail from "#fail";
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
  #path: { [K in keyof typeof location]: FileRef };
  #root: FileRef;
  #config: Config;
  #modules: Module[];
  #kv = new Map<symbol, unknown>();
  #mode: Mode;
  #target: TargetManager;

  constructor(root: FileRef, config: Config, mode: Mode) {
    this.#root = root;
    this.#config = config;
    this.#modules = config.modules?.flat(10) ?? [];
    this.#path = entries(location).valmap(([, path]) => root.join(path)).get();
    this.#mode = mode;
    this.#target = new TargetManager(this);
  }

  async init(target: string) {
    const names = this.#modules.map(({ name }) => name);
    if (new Set(names).size !== this.#modules.length) {
      throw fail("module {0} loaded twice", doubled(names));
    }

    const app = await reducer(this.#modules, this, "init");

    this.#target.set(target);

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
