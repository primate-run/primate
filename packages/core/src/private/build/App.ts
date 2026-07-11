import App from "#App";
import build from "#build/hook";
import type { Loader } from "#build/Loader";
import E from "#errors";
import resolve_paths from "#paths";
import type ServeApp from "#serve/App";
import s_layout_depth from "#symbol/layout-depth";
import type { FileRef } from "@rcompat/fs";
import type { Dict } from "@rcompat/type";
import type { Plugin } from "esbuild";

type PluginType = "server" | "client";
type ExtensionQuery = "backend" | "frontend" | "bundler";

type Frontend = Loader<"frontend">;
type Backend = Loader<"backend">;

function is_frontend(loader: Loader): loader is Frontend {
  return loader.type === "frontend";
}

function is_backend(loader: Loader): loader is Backend {
  return loader.type === "backend";
}

export default class BuildApp extends App {
  #loaders: Map<string, Loader> = new Map([
    ["javascript", {
      type: "backend",
      extensions: [".js"],
      onLoad: file => file.text(),
    }],
    ["typescript", {
      type: "backend",
      extensions: [".ts"],
      onLoad: file => file.text(),
    }],
  ]);
  #conditions = new Set<string>();
  #postbuild: (() => void)[] = [];
  #roots: Dict<string> = {};
  #id = crypto.randomUUID().slice(0, 8);
  #session_active = false;
  #paths!: Dict<string[]>;
  #plugins: { type: PluginType; plugin: Plugin }[] = [];
  #entrypoint_imports: string[] = [];

  async buildInit() {
    this.#paths = await resolve_paths(this);

    await build(this);
  }

  get id() {
    return this.#id;
  }

  get paths() {
    return this.#paths;
  }

  get conditions() {
    return this.#conditions;
  }

  backends() {
    return new Map([...this.#loaders.entries()]
      .filter((entry): entry is [string, Loader<"backend">] =>
        is_backend(entry[1])));
  }

  frontends(options: { client?: boolean } = {}) {
    return new Map([...this.#loaders.entries()]
      .filter((entry): entry is [string, Loader<"frontend">] =>
        is_frontend(entry[1]))
      .filter(([, frontend]) => options.client === undefined ||
        frontend.client === options.client));
  }

  register(name: string, loader: Loader) {
    const extensions = new Set(loader.extensions);
    for (const [existing_name, existing] of this.#loaders) {
      if (existing_name === name) continue;
      const duplicate = existing.extensions.find(extension => extensions.has(extension));
      if (duplicate !== undefined) throw E.view_duplicate_extension(duplicate);
    }
    this.#loaders.set(name, loader);
  }

  extensions(query: ExtensionQuery, options: { client?: boolean } = {}) {
    if (query === "backend") {
      return [...this.backends().values()].flatMap(backend => backend.extensions);
    }
    if (query === "frontend") {
      return [...this.frontends(options).values()]
        .flatMap(frontend => frontend.extensions);
    }

    return [".json", ...this.#loaders.values()
      .flatMap(loader => loader.extensions)];
  }

  addRoot(name: string, source: string) {
    this.#roots[name] = source;
  }

  get roots() {
    return this.#roots;
  }

  plugin(type: PluginType, plugin: Plugin) {
    this.#plugins.push({ type, plugin });
  }

  plugins(type: PluginType) {
    return this.#plugins
      .filter(plugin => plugin.type === type)
      .map(plugin => plugin.plugin);
  }

  entrypoint(code: string) {
    this.#entrypoint_imports.push(code);
  }

  get entrypoints() {
    return this.#entrypoint_imports.join("\n");
  }

  load(file: FileRef) {
    return [...this.#loaders.values()]
      .flatMap(loader => loader.extensions.map(extension => ({
        extension,
        loader,
      })))
      .toSorted((a, b) => a.extension.length > b.extension.length ? -1 : 1)
      .find(({ extension }) => file.path.endsWith(extension))
      ?.loader
      ;
  }

  done(fn: () => void) {
    this.#postbuild.push(fn);
  }

  cleanup() {
    this.#postbuild.forEach(fn => fn());
  }

  basename(file: FileRef, directory: FileRef) {
    const relative = file.debase(directory);
    const extensions = this.extensions("bundler")
      .toSorted((a, b) => a.length > b.length ? -1 : 1);
    for (const extension of extensions) {
      if (relative.path.endsWith(extension)) {
        return relative.path.slice(1, -extension.length);
      }
    }
    return relative.bare().path.slice(1);
  }

  depth(): number {
    return this.get<number>(s_layout_depth);
  }

  get session_active() {
    return this.#session_active;
  }

  set session_active(active: boolean) {
    this.#session_active = active;
  }

  async serve(): Promise<ServeApp> {
    return this.root.join("build/server.js").import("default");
  }
}
