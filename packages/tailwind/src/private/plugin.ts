import collect from "#collect";
import FileRef from "@rcompat/fs/FileRef";
import tailwindcss from "@tailwindcss/postcss";
import autoprefixer from "autoprefixer";
import type { Plugin } from "esbuild";
import postcss from "postcss";

interface TailwindPluginOptions {
  content: string[];
  config: string;
  root: FileRef;
}

export default function tailwindPlugin(options: TailwindPluginOptions): Plugin {
  return {
    name: "@primate/tailwind",

    setup(build) {
      build.onLoad({ filter: /\.css$/ }, async (args) => {
        const css = await FileRef.text(args.path);
        const has_tailwind = /@(?:tailwind|import\s+["']tailwindcss)/.test(css);
        if (!has_tailwind) return null;

        const files = await collect(options.content, options.root);
        const result = await postcss([tailwindcss, autoprefixer]).process(css, {
          from: args.path,
          to: args.path,
        });

        return {
          contents: result.css,
          loader: "css",
          watchFiles: [args.path, ...files],
        };
      });
    },
  };
}
