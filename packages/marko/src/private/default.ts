import create_root from "#create-root";
import init from "#init";
import { compileSync } from "@marko/compiler";
import frontend from "@primate/core/frontend";
import type { FileRef } from "@rcompat/fs";
import type { Plugin } from "esbuild";

type VirtualDependency = {
  virtualPath: string;
  code: string;
};

type VirtualStyle = {
  code: string;
  module: boolean;
};

const styles = new Map<string, VirtualStyle>();

let style_id = 0;
let root_dir = "";
let root_file = "";
let root_dom = "";

function resolveVirtualDependency(
  _from: string,
  dependency: VirtualDependency,
) {
  if (!dependency.virtualPath.endsWith(".css")) {
    return dependency.virtualPath;
  }

  const path = `marko:style:${style_id++}`;

  styles.set(path, {
    code: dependency.code,
    module: dependency.virtualPath.endsWith(".module.css"),
  });

  return path;
}

function compile(
  text: string,
  file: FileRef,
  output: "html" | "dom" | "hydrate",
  root = false,
) {
  return compileSync(text, root || file.path.startsWith("root:")
    ? root_file
    : file.path, {
    output,
    resolveVirtualDependency,
  });
}

const plugin: Plugin = {
  name: "marko-primate",
  setup(build) {
    build.onResolve({ filter: /^marko:style:/ }, args => ({
      path: args.path,
      namespace: "marko-style",
    }));

    build.onLoad({ filter: /.*/, namespace: "marko-style" }, args => {
      const style = styles.get(args.path);

      return style === undefined
        ? null
        : {
          contents: style.code,
          loader: style.module ? "local-css" : "css",
        };
    });

    build.onResolve({ filter: /^\.\/root\.marko$/ }, args => {
      if (args.namespace !== "marko" || args.importer !== "marko:root") {
        return null;
      }

      return {
        path: root_file,
        namespace: "file",
      };
    });

    build.onLoad({ filter: /.*/, namespace: "file" }, args => {
      if (args.path !== root_file) return null;

      return {
        contents: root_dom,
        loader: "js",
        resolveDir: root_dir,
      };
    });
  },
};

export default frontend({
  ...init,
  root: {
    create: create_root,
  },
  compile: {
    server: (text: string, file: FileRef) =>
      compile(text, file, "html").code,

    client: (text: string, file: FileRef, root: boolean, hydrate: boolean) => {
      if (root && hydrate) {
        root_dom = compile(text, file, "dom", true).code;

        return {
          js: `${compile(text, file, "hydrate", true).code}
           export { default } from "./root.marko";`,
        };
      }

      return {
        js: compile(text, file, "dom", root).code,
      };
    },
  },
  onBuild(app, options) {
    root_dir = app.root.path;
    root_file = app.root.join("root.marko").path;

    app.plugin("server", plugin);
    app.plugin("client", plugin);

    return init.onBuild?.(app, options);
  },
});
