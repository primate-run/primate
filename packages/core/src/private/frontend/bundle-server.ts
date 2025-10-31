import FileRef from "@rcompat/fs/FileRef";
import * as esbuild from "esbuild";

type Init = {
  code: string;
  source: FileRef;
  root: FileRef;
  extensions: string[];
  compile: (src: string, file?: FileRef) => Promise<string>;
  bundle: string[];
};

export default async function bundle_server(init: Init): Promise<string> {
  const { code, source, root, extensions, compile, bundle } = init;

  const filter = new RegExp(
    `(${extensions.map(e => e.replace(".", "\\.")).join("|")})$`,
  );

  const plugin: esbuild.Plugin = {
    name: "primate/bundle/server",
    setup(build) {
      // compile non-JS sources to JS
      build.onLoad({ filter }, async args => {
        const file = new FileRef(args.path);
        const src = await file.text();
        const contents = await compile(src, file);
        return { contents, loader: "js", resolveDir: file.directory.path };
      });

      // externalise anything not relative nor "#view/"
      build.onResolve({ filter: /.*/ }, args => {
        const p = args.path;
        const relative = p.startsWith("./") || p.startsWith("../");
        const views = p.startsWith("#view/");
        if (!relative && !views && !bundle.includes(p))
          return { path: p, external: true };
        return null;
      });
    },
  };

  const result = await esbuild.build({
    absWorkingDir: root.path,
    tsconfig: root.join("tsconfig.json").path,
    bundle: true,
    write: false,
    platform: "node",
    format: "esm",
    target: "esnext",
    conditions: ["node", "default", "apekit"],
    resolveExtensions: [".ts", ".js", ...extensions],
    plugins: [plugin],
    stdin: {
      contents: code,
      sourcefile: source.path,
      resolveDir: source.directory.path,
      loader: "js",
    },
    logLevel: "silent",
  });

  return result.outputFiles[0].text;
}
