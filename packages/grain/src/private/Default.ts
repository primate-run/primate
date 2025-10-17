import Runtime from "#Runtime";
import type BuildApp from "@primate/core/BuildApp";
import location from "@primate/core/location";
import type Mode from "@primate/core/Mode";
import type NextBuild from "@primate/core/NextBuild";
import assert from "@rcompat/assert";
import FileRef from "@rcompat/fs/FileRef";
import execute from "@rcompat/stdio/execute";
import string from "pema/string";

const Version = string.regex(/^0\.7\.\d+$/);
const dirname = import.meta.dirname;
const postlude_file = FileRef.join(dirname, "bootstrap", "postlude.gr");
const bootstrap_file = FileRef.join(dirname, "bootstrap", "index.js");

export default class Default extends Runtime {
  #command(
    wasm: FileRef,
    grain: FileRef,
    build_directory: FileRef,
    mode: Mode,
  ) {
    const config = this.config;
    const include_directories = new Set(config.includeDirs ?? []);
    include_directories.add(FileRef.join(dirname, "include").path);
    include_directories.add(build_directory.path);

    const sections = [
      config.command,
      "compile",
      // import memory is required to retrieve stores at compile time
      "--import-memory",
      "-o", wasm.name,
      grain.name,
      "-I", [...include_directories].join(","),
    ];

    if (config.stdlib) {
      sections.push("-S", config.stdlib);
    }

    // dev mode should generate faster builds and the wat text representation
    if (mode === "development") {
      sections.push("--debug", "--wat");
    } else {
      sections.push("--release");
    }

    if (config.noPervasives) sections.push("--no-pervasives");
    if (config.strictSequence) sections.push("--strict-sequence");

    return sections.join(" ");
  }

  async build(app: BuildApp, next: NextBuild) {
    Version.parse((await execute("grain --version")).split("\n")[0]);

    app.bind(this.fileExtension, async (route, { context }) => {
      assert(context === "routes", "grain: only route files are supported");

      const relative = route.debase(app.path.routes);
      const basename = relative.path.slice(1, -relative.extension.length);

      const text = await route.text();
      const postlude = await postlude_file.text();

      const grain_file = app.runpath(location.routes, `${basename}.gr`);
      await grain_file.directory.create({ recursive: true });
      await grain_file.write(`${text}\n${postlude}`);

      const wasm = app.runpath(location.routes, `${basename}.wasm`);
      const command = this.#command(wasm, grain_file, app.path.build, app.mode);
      await execute(command, { cwd: grain_file.directory.path });

      await grain_file.remove();

      const files = (await app.path.stores
        .collect(file => [".ts", ".js"].includes(file.extension)))
        .map(file => app.basename(file, app.path.stores));

      const stores =
        `Object.fromEntries(await Promise.all([${files
          .map(f => `"${f}"`)
          .join(",")}].map(async f=>
            [f,(await import(\`#store/\${f}\`)).default])))`;

      const code = (await bootstrap_file.text())
        .replaceAll("__FILENAME__", wasm.path)
        .replaceAll("__STORES__", stores);

      return code;
    });

    return next(app);
  }
}
