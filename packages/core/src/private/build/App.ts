import App from "#App";
import type Binder from "#Binder";
import build from "#build/hook";
import log from "#log";
import resolve_paths from "#paths";
import s_layout_depth from "#symbol/layout-depth";
import type FileRef from "@rcompat/fs/FileRef";
import type { Dict } from "@rcompat/type";
import type { Plugin } from "esbuild";

type PluginType = "server" | "client";

export default class BuildApp extends App {
  frontends: Map<string, string[]> = new Map();
  conditions = new Set<string>();
  #postbuild: (() => void)[] = [];
  #roots: Dict<string> = {};
  #id = crypto.randomUUID().slice(0, 8);
  #i18n_active = false;
  #session_active = false;
  #paths!: Dict<string[]>;
  #bindings: [string, Binder][] = [
    [".js", file => file.text()],
    [".ts", file => file.text()],
  ];
  #plugins: { type: PluginType; plugin: Plugin }[] = [];
  #entrypoint_imports: string[] = [];

  async buildInit() {
    log.system("starting {0} build in {1} mode", this.target.name, this.mode);

    this.#paths = await resolve_paths(this.root, this.config("paths"));
    await build(this);
  }

  get extensions() {
    const builtin = [".ts", ".js", ".json"];
    return [...builtin, ...this.#bindings.map(([extension]) => extension)];
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

  depth(): number {
    return this.get<number>(s_layout_depth);
  }

  get i18n_active() {
    return this.#i18n_active;
  }

  set i18n_active(active: boolean) {
    this.#i18n_active = active;
  }

  get session_active() {
    return this.#session_active;
  }

  set session_active(active: boolean) {
    this.#session_active = active;
  }
}
