import type Binder from "#Binder";
import type Config from "#config/Config";
import fail from "#fail";
import location from "#location";
import type Mode from "#Mode";
import type Module from "#Module";
import reducer from "#reducer";
import TargetManager from "#target/Manager";
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

const BIND_CONTEXTS = [
  "config",
  "routes",
  "components",
  "views",
  "stores",
  "locales",
  "modules",
];

function generate_bindings(_app: App): Dict<Binder> {
  return {
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
}

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
  #bindings: [string, Binder][];
  #target: TargetManager;

  constructor(root: FileRef, config: Config, mode: Mode) {
    this.#root = root;
    this.#config = config;
    this.#modules = config.modules?.flat(10) ?? [];
    this.#path = entries(location).valmap(([, path]) => root.join(path)).get();
    this.#mode = mode;
    this.#target = new TargetManager(this);
    this.#bindings = Object.entries(generate_bindings(this));
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
