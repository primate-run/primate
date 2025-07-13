import type BuildApp from "#BuildApp";
import Module from "#frontend/Module";
import location from "#location";
import type NextBuild from "#module/NextBuild";
import assert from "@rcompat/assert";
import FileRef from "@rcompat/fs/FileRef";
import type MaybePromise from "@rcompat/type/MaybePromise";

export default abstract class BuildModule extends Module {
  root?: {
    filter: RegExp;
    create: (depth: number) => string;
  };
  compile: {
    server?: (text: string) => MaybePromise<string>;
    client?: (text: string, file: FileRef) =>
    MaybePromise<{ js: string; css?: string }>;
  } = {};
  css?: {
    filter: RegExp;
  };

  publish(app: BuildApp) {
    if (this.compile.client) {
      const { compile, extension, name, root, rootname, css } = this;

      if (root !== undefined) {
        const code = `export { default as ${rootname} } from "root:${name}";`;
        app.build.save(`root:${name}`, root.create(app.depth()));
        app.export(code);
      }

      app.build.plugin({
        name,
        setup(build) {
          const resolveDir = app.path.build.path;

          if (root !== undefined) {
            build.onResolve({ filter: root.filter }, ({ path }) => {
              return { path, namespace: `${name}-root` };
            });
            build.onLoad({ filter: root.filter }, ({ path }) => {
              const contents = app.build.load(path);
              return contents ? { contents, loader: "js", resolveDir } : null;
            });
          }

          if (css !== undefined) {
            build.onResolve({ filter: css.filter }, ({ path }) => {
              return { path, namespace: `${name}-css` };
            });
            build.onLoad({ filter: css.filter }, ({ path }) => {
              const contents = app.build.load(FileRef.webpath(path));
              return contents
                ? { contents, loader: "css", resolveDir: app.root.path }
                : null;
            });
          }

          build.onLoad({ filter: new RegExp(`${extension}$`) }, async args => {
            const file = new FileRef(args.path);
            // Compile file to JavaScript and potentially CSS
            const compiled = await compile.client!(await file.text(), file);

            let contents = compiled.js;

            if (css && compiled.css !== undefined) {
              const path = FileRef.webpath(`${args.path}css`);
              app.build.save(path, compiled.css);
              contents += `\nimport "${path}";`;
            }

            return { contents };
          });
        },
      });
      app.export(`
        export { default as spa } from "@primate/core/frontend/spa";
        // uses the package's "browser" export key, -> public/browser.ts
        export * from "${this.package}";
      `);
    }
  }

  async build(app: BuildApp, next: NextBuild) {
    // compile root server
    if (this.root !== undefined && this.compile.server !== undefined) {
      const filename = `root_${name}.js`;
      const root = await this.compile.server(this.root.create(app.depth()));
      const path = app.runpath(location.server, filename);
      await path.write(root);
      app.roots.push(path);
    }

    app.bind(this.extension, async (file, context) => {
      assert(context === "components",
        `${this.name}: only components supported`);

      // build/stage/components
      const directory = file.directory;

      if (this.compile.server) {
        // compile server component
        const code = await this.compile.server(await file.text());
        await file.append(".js").write(code.replaceAll(this.extension, ".js"));
      }

      if (this.compile.client) {
        // compile client component
        const { path } = file.debase(directory, "/");
        const code = `export { default as ${await this.normalize(path)} } from
         "./${location.components}/${path}";`;

        app.export(code);
      }
    });

    this.publish(app);

    return next(app);
  };
}
