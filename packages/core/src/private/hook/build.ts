import type BuildApp from "#BuildApp";
import db_plugin from "#bundle/db";
import stores_plugin from "#bundle/stores";
import views_plugin from "#bundle/views";
import fail from "#fail";
import location from "#location";
import log from "#log";
import reducer from "#reducer";
import $router from "#request/router";
import wrap from "#route/wrap";
import type ServeApp from "#ServeApp";
import s_layout_depth from "#symbol/layout-depth";
import FileRef from "@rcompat/fs/FileRef";
import pkg from "@rcompat/fs/project/package";
import runtime from "@rcompat/runtime";
import type Dict from "@rcompat/type/Dict";
import * as esbuild from "esbuild";
import { createRequire } from "node:module";

const requirer = createRequire(import.meta.url);
const externals = {
  node: ["node:"],
  bun: ["node:", "bun:"],
  deno: ["node:"],
};
const conditions = {
  node: ["node"],
  bun: ["bun", "node"],
  deno: ["deno", "node"],
};
const dirname = import.meta.dirname;

async function bundle_server(app: BuildApp) {
  const routes: esbuild.Plugin = {
    name: "primate/route-wrap",
    setup(build) {
      const routes_re = /[/\\]routes[/\\].+\.(ts|js)$/;

      build.onLoad({ filter: routes_re }, async args => {
        const file = new FileRef(args.path);
        const source = await file.text();

        const routesRoot = "routes";
        const relFromRoutes = args.path.split(routesRoot).pop()!;
        const noExt = relFromRoutes.replace(/\.(ts|js)$/, "");
        const routePath = noExt.replace(/^[\\/]/, "").replace(/\\/g, "/");

        const wrapped = wrap(source, routePath, app.id);

        return {
          contents: wrapped,
          loader: args.path.endsWith(".ts") ? "ts" : "js",
          resolveDir: file.directory.path,
        };
      });
    },
  };

  const plugins = [routes];
  const extensions = app.frontendExtensions;

  if (extensions.length > 0) {
    const filter = new RegExp(
      `(${extensions.map(e => e.replace(".", "\\.")).join("|")})$`,
    );

    const frontends: esbuild.Plugin = {
      name: "primate/server/bundle",
      setup(build) {
        build.onLoad({ filter }, async args => {
          const file = new FileRef(args.path);
          const binder = app.binder(file);
          if (!binder) return null;

          const contents = await binder(file, {
            build: { id: app.id, stage: app.runpath("stage") },
            context: "views",
          });

          return { contents, loader: "js", resolveDir: file.directory.path };
        });
      },
    };

    plugins.push(frontends);
  }

  plugins.push(views_plugin(
    app.path.views.path,
    app,
    app.extensions,
  ));

  plugins.push(stores_plugin(
    app.path.stores.path,
    app.extensions,
  ));

  plugins.push(db_plugin(app));

  if (app.mode === "development") {
    let build_n = 0;
    let serve_app: ServeApp | undefined;
    plugins.push({
      name: "primate/server/hot-reload",
      setup(build) {
        build.onEnd(async (result) => {
          // don't do anything on errors
          if (result.errors.length) return;
          // we expect a single bundled file
          const outFile = result.outputFiles?.[0];
          if (!outFile) return;

          const filename = `server.${build_n}.js`; // or a hash
          const s = app.path.build.join(filename);
          await s.write(outFile.text);

          try {
            // stop old app
            if (serve_app !== undefined) {
              serve_app.stop();
            }
            serve_app = (await s.import()).default as ServeApp;

            const stamp = app.runpath("client", "server-stamp.js");
            await stamp.write(`export default ${build_n};\n`);

            build_n++;
          } catch (err) {
            console.error("[primate/server/hot-reload] failed to import", filename);
            console.error(err);
          }
        });
      },
    });
  }

  const virtual_pages_plugin: esbuild.Plugin = {
    name: "primate/virtual/pages",
    setup(build) {
      build.onResolve({ filter: /^app:pages$/ }, () => {
        return { path: "pages-virtual", namespace: "primate-pages" };
      });

      build.onLoad({ filter: /.*/, namespace: "primate-pages" }, async () => {
        const html = /^.*\.html$/ui;
        const is_html = (file: FileRef) => html.test(file.path);

        const defaults = FileRef.join(import.meta.url, "../../defaults");

        const pages: Dict<FileRef> = {};

        for (const file of await defaults.collect(is_html)) pages[file.name] = file;

        if (await app.path.pages.exists()) {
          for (const file of await app.path.pages.collect(is_html)) pages[file.name] = file;
        }

        const entries = await Promise.all(
          Object.entries(pages).map(async ([name, file]) => {
            const text = await file.text();
            return `"${name}": ${JSON.stringify(text)}`;
          }),
        );

        const contents = `
          const pages = {
            ${entries.join(",\n")}
          };
          export default pages;
        `;

        return {
          contents,
          loader: "js",
          resolveDir: app.root.path,
        };
      });
    },
  };
  plugins.push(virtual_pages_plugin);

  const virtual_routes_plugin: esbuild.Plugin = {
    name: "primate/virtual/routes",
    setup(build) {
      const routes_path = app.path.routes;

      build.onResolve({ filter: /^app:routes$/ }, () => {
        return { path: "routes-virtual", namespace: "primate-routes" };
      });

      build.onLoad({ filter: /.*/, namespace: "primate-routes" }, async () => {
        const route_files = await routes_path.collect(f =>
          f.path.match(/\.(ts|js|py|rb|go)$/) !== null,
        );

        const watchDirs = new Set<string>();
        const findDirs = async (dir: FileRef) => {
          watchDirs.add(dir.path);
          const entries = await dir.list();
          for (const entry of entries) {
            if (await entry.isDirectory()) {
              await findDirs(entry);
            }
          }
        };
        await findDirs(app.path.routes);

        const contents = `
          const route = [];
          ${route_files.map((file, i) => {
          const path = app.basename(file, app.path.routes);
          return `const route${i} = (await import("#route/${path}")).default;
            route.push(["${path}", route${i}]);`;
        }).join("\n")}
          export default route;
        `;

        return {
          contents,
          loader: "js",
          resolveDir: app.root.path,
          watchDirs: [...watchDirs],
          watchFiles: route_files.map(f => f.path),
        };
      });
    },
  };
  plugins.push(virtual_routes_plugin);

  const virtual_roots_plugin: esbuild.Plugin = {
    name: "primate/virtual/roots",
    setup(build) {
      build.onResolve({ filter: /^app:root\// }, args => {
        const name = args.path.slice("app:root/".length);
        return { path: name, namespace: "primate-roots" };
      });

      build.onLoad({ filter: /.*/, namespace: "primate-roots" }, args => {
        const contents = app.roots[args.path];

        if (!contents) throw new Error(`no root registered for ${args.path}`);

        return { contents, loader: "js", resolveDir: app.root.path };
      });
    },
  };

  plugins.push(virtual_roots_plugin);

  const virtual_views_plugin: esbuild.Plugin = {
    name: "primate/virtual/views",
    setup(build) {
      build.onResolve({ filter: /^app:views/ }, () => {
        return { path: "views-virtual", namespace: "primate-views" };
      });

      build.onLoad({ filter: /.*/, namespace: "primate-views" }, async () => {
        const files = await app.path.views.collect();
        const roots = Object.keys(app.roots);
        const contents = `
        const view = [];
        ${files.map((file, i) => {
          const path = app.basename(file, app.path.views);
          return `
            import * as view${i} from "${FileRef.webpath(`view:${path}`)}";
            view.push(["${FileRef.webpath(path)}", view${i}]);`;
        }).join("\n")}

        ${roots.map((filename, i) => `
          import * as root${i} from "app:root/${filename}";
          view.push(["${filename}", root${i}]);
        `).join("\n")}

        export default view;`;

        return {
          contents,
          loader: "js",
          resolveDir: app.root.path,
        };
      });
    },
  };
  plugins.push(virtual_views_plugin);

  const virtual_stores_plugin: esbuild.Plugin = {
    name: "primate/virtual/stores",
    setup(build) {
      build.onResolve({ filter: /^app:stores$/ }, () => {
        return { path: "stores-virtual", namespace: "primate-stores" };
      });

      build.onLoad({ filter: /.*/, namespace: "primate-stores" }, async () => {
        const d2 = app.path.stores;
        const e = await Promise.all(
          (await FileRef.collect(d2, file => jts_re.test(file.path)))
            .map(async path => `${path}`.replace(d2.toString(), _ => "")),
        );

        const contents = `
        const stores = {};
        ${e.map(path => path.slice(1, -".js".length)).map((bare, i) =>
          `import * as store${i} from "${FileRef.webpath(`#store/${bare}`)}";
           stores["${FileRef.webpath(bare)}"] = store${i}.default;`,
        ).join("\n")}
        export default stores;
      `;

        return {
          contents,
          loader: "js",
          resolveDir: app.root.path,
        };
      });
    },
  };
  plugins.push(virtual_stores_plugin);

  const native_addon_plugin: esbuild.Plugin = {
    name: "primate/native-addons",
    setup(build) {
      build.onResolve({ filter: /.*/ }, async args => {
        // only check require calls for non-relative paths
        if (args.kind === "require-call" && !args.path.startsWith(".") && !args.path.startsWith("/")) {
          try {
            // resolve the module from the import location
            const module_path = requirer.resolve(args.path, {
              paths: [args.resolveDir],
            });
            const module_dir = new FileRef(module_path).directory;

            // check if this module has .node files
            const node_files = await module_dir.collect(f => f.path.endsWith(".node"));

            if (node_files.length > 0) {
              const platform = process.platform;
              const arch = process.arch;

              let nodeFile = node_files.find(f =>
                f.path.includes(`${platform}-${arch}`),
              );
              if (!nodeFile) {
                nodeFile = node_files.find(f => f.path.includes(platform));
              }
              if (!nodeFile) {
                throw fail("could not find matching binary addon");
              }

              const addon_name = node_files[0].name;
              const dest = app.path.build.join("native", addon_name);
              await dest.directory.create();
              await node_files[0].copy(dest);

              log.info("copied native addon {0}", addon_name);

              return {
                path: `./native/${addon_name}`,
                external: true,
              };
            }
          } catch {
            // module not found or can't be resolved
          }
        }

        return null;
      });
    },
  };
  plugins.push(native_addon_plugin);

  const ignore_failed_requires: esbuild.Plugin = {
    name: "primate/ignore-failed-requires",
    setup(build) {
      build.onResolve({ filter: /.*/ }, async args => {
        // skip if we're already in our namespace (prevent recursion)
        if (args.namespace === "ignore-failed-check") {
          return null;
        }

        if (args.kind === "require-call" && !args.path.startsWith(".") && !args.path.startsWith("/")) {
          try {
            // resolve in a different namespace to avoid retriggering
            const result = await build.resolve(args.path, {
              kind: args.kind,
              resolveDir: args.resolveDir,
              namespace: "ignore-failed-check",
            });

            if (result.errors.length === 0) return null;
          } catch {

          }

          return { path: args.path, external: true };
        }

        return null;
      });
    },
  };
  plugins.push(ignore_failed_requires);

  const python_loader: esbuild.Plugin = {
    name: "primate/python-loader",
    setup(build) {
      build.onResolve({ filter: /\.py$/ }, args => {
        // normalize a few shapes we know can appear
        if (args.path.startsWith("#route/")) {
          const rel = args.path.slice("#route/".length);
          const real = app.path.routes.join(rel).path;
          return { path: real, namespace: "python-source" };
        }

        // sometimes the generated JS will say "routes/foo.py"
        if (args.path.startsWith("routes/")) {
          const rel = args.path.slice("routes/".length);
          const real = app.path.routes.join(rel).path;
          return { path: real, namespace: "python-source" };
        }

        // absolute or already-correct path
        return {
          path: args.path,
          namespace: "python-source",
        };
      });

      build.onLoad({ filter: /.*/, namespace: "python-source" }, async args => {
        const file = new FileRef(args.path);
        const content = await file.text();

        return {
          contents: `export default ${JSON.stringify(content)};`,
          loader: "js",
          resolveDir: file.directory.path,
          watchFiles: [file.path],
        };
      });
    },
  };
  plugins.push(python_loader);

  const python_routes: esbuild.Plugin = {
    name: "primate/python-route-wrap",
    setup(build) {
      const routes_re = /[/\\]routes[/\\].+\.py$/;

      build.onLoad({ filter: routes_re }, async args => {
        const file = new FileRef(args.path);
        const binder = app.binder(file);
        if (!binder) {
          // fall back to empty module so esbuild doesn't explode
          return { contents: "export default {};", loader: "js" };
        }

        const compiled = await binder(file, {
          build: { id: app.id, stage: app.runpath("stage") },
          context: "routes",
        });

        const relFromRoutes = args.path.split("routes").pop()!;
        const noExt = relFromRoutes.replace(/^[\\/]/, "").replace(/\.py$/, "");
        const routePath = noExt.replace(/\\/g, "/");

        const wrapped = wrap(compiled, routePath, app.id);

        return {
          contents: wrapped,
          loader: "js",
          resolveDir: file.directory.path,
          watchFiles: [file.path],
        };
      });
    },
  };
  plugins.push(python_routes);

  const ruby_routes: esbuild.Plugin = {
    name: "primate/ruby-route-wrap",
    setup(build) {
      const routes_re = /[/\\]routes[/\\].+\.rb$/;

      build.onLoad({ filter: routes_re }, async args => {
        const file = new FileRef(args.path);
        const binder = app.binder(file);

        if (!binder) return { contents: "export {};", loader: "js" };

        const compiled = await binder(file, {
          build: { id: app.id, stage: app.runpath("stage") },
          context: "routes",
        });

        // now figure out the route path from its location under routes/
        const relFromRoutes = args.path.split("routes").pop()!;
        const noExt = relFromRoutes.replace(/^[\\/]/, "").replace(/\.rb$/, "");
        const routePath = noExt.replace(/\\/g, "/");

        // and wrap it so the router sees the right path
        const wrapped = wrap(compiled, routePath, app.id);

        return {
          contents: wrapped,
          loader: "js",
          resolveDir: file.directory.path,
          watchFiles: [file.path],
        };
      });
    },
  };
  plugins.push(ruby_routes);

  const go_routes: esbuild.Plugin = {
    name: "primate/go-route-wrap",
    setup(build) {
      const routes_re = /[/\\]routes[/\\].+\.go$/;

      build.onLoad({ filter: routes_re }, async args => {
        const file = new FileRef(args.path);
        const binder = app.binder(file);

        if (!binder) return { contents: "export {};", loader: "js" };

        const compiled = await binder(file, {
          build: { id: app.id, stage: app.runpath("stage") },
          context: "routes",
        });

        // figure out the route path from its location under routes/
        const relFromRoutes = args.path.split("routes").pop()!;
        const noExt = relFromRoutes.replace(/^[\\/]/, "").replace(/\.go$/, "");
        const routePath = noExt.replace(/\\/g, "/");

        const wasmPath = app.runpath("wasm", `${routePath}.wasm`).path;
        // wrap it so the router sees the right path
        const wrapped = wrap(compiled, routePath, app.id);

        return {
          contents: wrapped,
          loader: "js",
          resolveDir: file.directory.path,
          watchFiles: [file.path, wasmPath],
        };
      });
    },
  };
  plugins.push(go_routes);

  const wasm_rewrite: esbuild.Plugin = {
    name: "primate/wasm/rewrite",
    setup(build) {
      const re = /^#wasm\/(.+)\.wasm$/;

      build.onResolve({ filter: re }, (args) => {
        const match = re.exec(args.path);
        if (!match) return;

        return {
          path: app.runpath("wasm", match[1]).path + ".wasm",
          namespace: "file",
        };
      });
    },
  };
  plugins.push(wasm_rewrite);

  const config_alias: esbuild.Plugin = {
    name: "primate/config-alias",
    setup(build) {
      build.onResolve({ filter: /^app:config$/ }, async () => {
        const ts = app.path.config.join("app.ts");
        if (await ts.exists()) return { path: ts.path };

        const js = app.path.config.join("app.js");
        if (await js.exists()) return { path: js.path };

        return {
          path: "app-config-default",
          namespace: "primate-config-default",
        };
      });

      build.onLoad({ filter: /.*/, namespace: "primate-config-default" }, () => {
        const contents = `
          import config from "primate/config";
          export default config();
        `;

        return {
          contents,
          loader: "js",
          resolveDir: app.root.path,
        };
      });

      build.onResolve({ filter: /^app:config:(.+)$/ }, async args => {
        const name = args.path.slice("app:config:".length);

        const ts = app.path.config.join(`${name}.ts`);
        if (await ts.exists()) return { path: ts.path };

        const js = app.path.config.join(`${name}.js`);
        if (await js.exists()) return { path: js.path };

        // should never happen because we only import when session_active is
        // true, but if it does, fail loudly.
        throw fail(`missing config for ${name} in app/config`);
      });
    },
  };
  plugins.push(config_alias);

  const nodePaths = [app.root.join("node_modules").path];

  const build_options = {
    entryPoints: [app.path.build.join("serve.js").path],
    outfile: app.path.build.join("server.js").path,
    bundle: true,
    platform: "node",
    format: "esm",
    packages: app.mode === "development" ? "external" : undefined,
    external: [...externals[runtime]],
    loader: {
      ".json": "json",  // Import JSON as ESM modules
    },
    banner: {
      js: `
        import { createRequire as __createRequire } from "node:module";
        const require = __createRequire(import.meta.url);
      `,
    },
    nodePaths,
    resolveExtensions: [".ts", ".js", ...extensions, ".py", ".rb", ".go"],
    absWorkingDir: app.root.path,
    tsconfig: app.root.join("tsconfig.json").path,
    conditions: [
      ...conditions[runtime],
      "module", "import", "runtime", "default",
      ...app.conditions],
    plugins,
    write: app.mode !== "development",
  };
  if (app.mode === "development") {
    const context = await esbuild.context(build_options as never);
    //await context.rebuild();
    await context.watch();
  } else {
    await esbuild.build(build_options as never);
  }

  log.warn("bundled server to {0}", app.path.build.join("server.js"));
}

const {
  version
} = await (await pkg(import.meta.url)).json() as { version: string };

const pre = async (app: BuildApp) => {
  const dot_primate = app.path.build.join(".primate");
  if (await app.path.build.exists() && !await dot_primate.exists()) {
    const message = "{0} exists but does not contain a previous build";
    throw fail(message, app.path.build.path);
  }
  // remove build directory in case exists
  await app.path.build.remove();
  await app.path.build.create();
  // touch a .primate file to indicate this is a Primate build directory
  await dot_primate.write(version);

  await Promise.all(["client"].map(directory => app.runpath(directory).create()));
  const stamp = app.runpath("client", "server-stamp.js");
  await stamp.write("export default 0;\n");

  // this has to occur before post, so that layout depth is available for
  // compiling root views
  // bindings should have been registered during `init`
  const router = await $router(app.path.routes, app.extensions);
  app.set(s_layout_depth, router.depth("layout"));

  const i18n_ts = app.path.config.join("i18n.ts");
  const i18n_js = app.path.config.join("i18n.js");
  app.i18n_active = await i18n_ts.exists() || await i18n_js.exists();

  const session_ts = app.path.config.join("session.ts");
  const session_js = app.path.config.join("session.js");
  app.session_active = await session_ts.exists() || await session_js.exists();

  return app;
};

async function index_database(base: FileRef) {
  // app/config/database does not exist -> use prelayered default
  if (!await base.exists()) return "";

  const databases = await base.list();
  const n = databases.length;

  // none in app/config/database -> use prelayered default
  if (n === 0) return "";

  const names = databases.map(d => d.name);

  // index database file found, will be overwritten in next step -> do nothing
  if (names.includes("index.ts") || names.includes("index.js")) {
    return ""; // empty string means: don't generate, user provided own
  }

  // app/config/default.ts -> reexport
  if (names.includes("default.ts")) {
    return "export { default } from \"./default.js\";";
  }

  // app/config/default.js -> reexport
  if (names.includes("default.js")) {
    return "export { default } from \"./default.js\";";
  }

  // exactly one in app/config/database -> reexport that
  if (n === 1) {
    const onlyFile = names[0];
    const withoutExt = onlyFile.replace(/\.(ts|js)$/, ".js");
    return `export { default } from "./${withoutExt}";`;
  }

  // multiple files, none is index or default -> error
  throw fail(
    "multiple database drivers, add index or default.(ts|js); found {0}",
    names.join(", "),
  );
}

const jts_re = /^.*.[j|t]s$/;

const write_bootstrap = async (app: BuildApp, mode: string) => {
  const build_start_script = `
import serve from "primate/serve";
import Loader from "primate/Loader";
import views from "app:views";
import routes from "app:routes";
import pages from "app:pages";
import target from "./target.js";
import s_config from "primate/symbol/config";
${app.session_active ? `
import session from "app:config:session";
const session_config = session[s_config];
` : `
const session_config = undefined;
`}
import config from "app:config";

${app.i18n_active ? `
import i18n from "app:config:i18n";
const i18n_config = i18n[s_config];
` : `
const i18n_config = undefined;
`}

const loader = new Loader({
  pages,
  rootfile: import.meta.url,
  static_root: config.http.static.root,
});

const app = await serve(import.meta.url, {
  ...target,
  config,
  routes,
  views,
  mode: "${mode}",
  session_config,
  i18n_config,
  loader,
});

export default app;
`;
  await app.path.build.join("serve.js").write(build_start_script);
};

const post = async (app: BuildApp) => {
  const configs = FileRef.join(dirname, "../../private/config/config");
  const database_base = app.path.config.join("database");

  // prelayer config default
  await app.compile(configs, "config", {
    loader: async (source, file) => {
      const relative = file.debase(configs);
      if (relative.path === "/database/index.js") {
        const indexContent = await index_database(database_base);
        // if empty, user provided own index -> use the compiled source
        return indexContent || source;
      }
      return source;
    },
  });

  await app.compile(app.path.locales, "locales");
  await app.compile(app.path.config, "config");

  if (await app.path.static.exists()) {
    // copy static files to build/static
    await app.path.static.copy(app.runpath(location.static));
  }

  // publish JavaScript and CSS files
  const imports = await FileRef.collect(app.path.static,
    file => /\.(?:js|ts|css)$/.test(file.path));
  await Promise.all(imports.map(async file => {
    const src = file.debase(app.path.static);
    app.build.export(`import "./${location.static}${src}";`);
  }));

  app.build.export("import \"primate/client/app\";");

  app.build.plugin({
    name: "@primate/core/frontend",
    setup(build) {
      build.onResolve({ filter: /#frontends/ }, ({ path }) => {
        return { namespace: "frontends", path };
      });
      build.onLoad({ filter: /#frontends/ }, async () => {
        const contents = [...app.frontends.keys()].map(name =>
          `export { default as ${name} } from "@primate/${name}";`).join("\n");
        return { contents, resolveDir: app.root.path };
      });
    },
  });

  app.build.plugin({
    name: "@primate/core/alias",
    setup(build) {
      build.onResolve({ filter: /#static/ }, args => {
        const path = args.path.slice(1);
        return { path: app.root.join(path).path };
      });
    },
  });

  app.build.plugin({
    name: "@primate/core/server-stamp",
    setup(build) {
      build.onResolve({ filter: /^server:stamp$/ }, () => {
        return {
          path: app.runpath("client", "server-stamp.js").path,
          sideEffects: true,
        };
      });
    },
  });

  // start the build
  await app.build.start();

  // a target needs to create an `assets.js` that exports assets
  await app.target.run();

  await write_bootstrap(app, app.mode);

  log.system("build written to {0}", app.path.build);

  app.cleanup();

  await bundle_server(app);
  return app;
};

export default async (app: BuildApp) =>
  post(await reducer(app.modules, await pre(app), "build"));
