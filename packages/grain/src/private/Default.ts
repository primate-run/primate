import Runtime from "#Runtime";
import type BuildApp from "@primate/core/BuildApp";
import type Mode from "@primate/core/Mode";
import type NextBuild from "@primate/core/NextBuild";
import wrap from "@primate/core/route/wrap";
import assert from "@rcompat/assert";
import FileRef from "@rcompat/fs/FileRef";
import execute from "@rcompat/stdio/execute";

const dirname = import.meta.dirname;
const postlude_file = FileRef.join(dirname, "bootstrap", "postlude.gr");
const bootstrap_file = FileRef.join(dirname, "bootstrap", "index.js");

export default class Default extends Runtime {
  #command(wasm: FileRef, grain: FileRef, mode: Mode) {
    const config = this.config;

    const includeDirs = new Set(config.includeDirs ?? []);
    includeDirs.add(FileRef.join(dirname, "include").path);

    const sections = [
      config.command,
      "compile",
      // Import memory is required so that stores can be retrieved at compile time
      "--import-memory",
      "-o", wasm.name,
      grain.name,
      "-I", [...includeDirs].join(","),
    ];
    if (config.stdlib) {
      sections.push("-S", config.stdlib);
    }

    // Dev mode should generate faster builds and the wat text representation
    if (mode === "development") {
      sections.push("--debug", "--wat");
    } else {
      sections.push("--release");
    }

    if (config.noPervasives) {
      sections.push("--no-pervasives");
    }

    if (config.strictSequence) {
      sections.push("--strict-sequence");
    }

    return sections.join(" ");
  }

  build(app: BuildApp, next: NextBuild) {
    app.bind(this.extension, async (route, { build, context }) => {
      assert(context === "routes", "grain: only route files are supported");
      const text = await route.text();
      const postlude = await postlude_file.text();
      await route.write(`${text}\n${postlude}`);
      const wasm = route.bare(".wasm");
      const command = this.#command(wasm, route, app.mode);
      await execute(command, { cwd: `${route.directory}` });
      const files = (await app.path.stores
        .collect(file => [".ts", ".js"].includes(file.extension)))
        .map(file => file.debase(`${app.path.stores}/`).path.slice(0, -".ts".length));
      const storeStr =
        `Object.fromEntries(await Promise.all([${files.map(f => `"${f}"`).join(",")}].map(async f=>[f,(await import(\`#store/\${f}\`)).default])))`;
      const code = (await bootstrap_file.text())
        .replaceAll("__FILENAME__", wasm.path)
        .replaceAll("__STORES__", storeStr);
      await route.bare(".gr.js").write(wrap(code, route, build));
    });

    return next(app);
  }
}
