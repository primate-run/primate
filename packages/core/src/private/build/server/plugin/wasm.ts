import type BuildApp from "#build/App";
import type { Plugin } from "esbuild";

export default function plugin_server_wasm(app: BuildApp): Plugin {
  return {
    name: "primate/server/wasm",
    setup(build) {
      const re = /^app:wasm\/(.+)\.wasm$/;

      build.onResolve({ filter: re }, args => {
        const match = re.exec(args.path);
        if (!match) return;

        if (app.mode === "development") return {
          path: match[1],
          namespace: "wasm-dev",
        };
        else return {
          path: app.runpath("wasm", match[1]).path + ".wasm",
          namespace: "file",
        };
      });

      build.onLoad({ filter: /.*/, namespace: "wasm-dev" }, async args => {
        const wasm_file = app.runpath("wasm", args.path + ".wasm");

        return {
          contents: `
            import FileRef from "primate/fs/FileRef";
            const file = new FileRef("${wasm_file.path}");
            export default await file.bytes();
          `,
          loader: "js",
          resolveDir: app.root.path,
        };
      });
    },
  };
}
