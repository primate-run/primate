import App from "#App";
import type BindingContext from "#BindingContext";
import build from "#hook/build";
import location from "#location";
import log from "#log";
import s_layout_depth from "#symbol/layout-depth";
import Build from "@rcompat/build";
import type FileRef from "@rcompat/fs/FileRef";
import cache from "@rcompat/kv/cache";
import type MaybePromise from "@rcompat/type/MaybePromise";

const s = Symbol("primate.Build");

export default class BuildApp extends App {
  frontends: Map<string, string> = new Map();
  #postbuild: (() => void)[] = [];
  #roots: FileRef[] = [];
  #server_build: string[] = ["route"];
  #id = crypto.randomUUID().slice(0, 8);
  #i18n_active = false;

  async buildInit() {
    log.system("starting {0} build in {1} mode", this.target.name, this.mode);
    await build(this);
  }

  get id() {
    return this.#id;
  }

  get build() {
    const extensions = [...this.frontends.values()];
    return cache.get(s, () =>
      new Build({
        ...(this.config("build")),
        outdir: this.runpath(location.client).path,
        stdin: {
          contents: "",
          resolveDir: this.root.path,
        },
        conditions: ["style", "browser", "default", "module"],
        resolveExtensions: [".ts", ".js", ...extensions],
        tsconfigRaw: {
          compilerOptions: {
            baseUrl: "${configDir}",
            paths: {
              "#lib/*": [
                "lib/*", ...extensions.map(e => `lib/*${e}`),
              ],
              "#component/*": [
                "components/*", ...extensions.map(e => `components/*${e}`),
              ],
              "#static/*": ["./static/*.js", "./static/*.ts"],
              "#i18n": ["config/i18n.ts", "config/i18n.js"],
              "#store/*": ["stores/*"],
              "#locale/*": ["locales/*"],
              "#config/*": ["config/*"],
              "#session": ["config/session.ts", "config/session.js"],
              "#database": [
                "config/database/index.ts",
                "config/database/index.js",
                "config/database/default.ts",
                "config/database/default.js",
              ],
            },
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

  async stage(directory: FileRef, context: BindingContext,
    importer: (file: FileRef) => MaybePromise<string>) {
    if (!await directory.exists()) {
      return;
    }
    if (!await this.runpath("stage").exists()) {
      await this.runpath("stage").create();
    }
    const base = this.runpath("stage", context);
    if (!await base.exists()) {
      await base.create();
    }
    const build_directory = this.runpath(directory.name);
    await build_directory.create();

    for (const file of await directory.collect(({ path }) => /^.*$/.test(path))) {
      const debased = file.debase(directory);
      const target = base.join(debased);
      if (!await target.directory.exists()) {
        await target.directory.create({ recursive: true });
      }

      const binder = this.binder(file);
      if (binder === undefined) {
        log.info("no binder found for {0}", file.path);
        continue;
      }

      // copy to build/stage/${directory}
      await file.copy(target);
      await binder(target, {
        build: { id: this.id, stage: this.runpath("stage") },
        context,
      });

      // actual
      const runtime_file = build_directory.join(debased.bare(".js"));
      await runtime_file.directory.create();
      runtime_file.write(await importer(debased));
    }
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
