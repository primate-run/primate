import type BuildApp from "#BuildApp";
import db_plugin from "#bundle/db";
import require_plugin from "#bundle/require";
import stores_plugin from "#bundle/stores";
import views_plugin from "#bundle/views";
import DEFAULT_PATHS from "#DEFAULT_PATHS";
import fail from "#fail";
import location from "#location";
import log from "#log";
import reducer from "#reducer";
import $router from "#request/router";
import wrap from "#route/wrap";
import type ServeApp from "#ServeApp";
import s_layout_depth from "#symbol/layout-depth";
import FileRef from "@rcompat/fs/FileRef";
import json from "@rcompat/package/json";
import runtime from "@rcompat/runtime";
import type Dict from "@rcompat/type/Dict";
import * as esbuild from "esbuild";

const externals = {
  node: ["node:"],
  bun: ["node:", "bun:"],
  deno: ["node:"],
};
const conditions = {
  node: [],
  bun: ["bun"],
  deno: ["deno"],
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

  plugins.push(require_plugin());

  plugins.push(stores_plugin(
    app.path.stores.path,
    async (file) => {
      const binder = app.binder(file);
      if (!binder) throw new Error(`No binder for ${file.path}`);
      return await binder(file, {
        build: { id: app.id, stage: app.runpath("stage") },
        context: "stores",
      });
    },
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

          // stop old app
          if (serve_app !== undefined) {
            serve_app.stop();
          }
          serve_app = (await s.import()).default as ServeApp;

          const stamp = app.runpath("client", "server-stamp.js");
          await stamp.write(`export default ${build_n};\n`);

          build_n++;
        });
      },
    });
  }

  const routes_plugin: esbuild.Plugin = {
    name: "primate/routes-virtual",
    setup(build) {
      build.onResolve({ filter: /^#routes$/ }, () => {
        console.log("on resolve");
        return { path: "routes-virtual", namespace: "primate-routes" };
      });

      build.onLoad({ filter: /.*/, namespace: "primate-routes" }, async () => {
        console.log("on load");
        const routeFiles = await app.path.routes.collect(f =>
          f.path.match(/\.(ts|js)$/) !== null,
        );
        const contents = `
const route = [];
${routeFiles.map((file, i) => {
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
          watchDirs: [app.path.routes.path],
        };
      });
    },
  };
  plugins.push(routes_plugin);

  const build_options = {
    entryPoints: [app.path.build.join("serve.js").path],
    outfile: app.path.build.join("server.js").path,
    bundle: true,
    platform: "node",
    format: "esm",
    packages: app.mode === "development" ? "external" : undefined,
    external: [...externals[runtime], "esbuild"],
    banner: {
      js: `
        import { createRequire as __createRequire } from "node:module";
        const require = __createRequire(import.meta.url);
      `,
    },
    resolveExtensions: [".ts", ".js", ...extensions],
    conditions: ["module", "import", ...conditions[runtime], "default", "node", ...app.conditions],
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

const pre = async (app: BuildApp) => {
  // remove build directory in case exists
  await app.path.build.remove();
  await app.path.build.create();

  await Promise.all(["server", "client", "views"]
    .map(directory => app.runpath(directory).create()));
  const stamp = app.runpath("client", "server-stamp.js");
  await stamp.write("export default 0;\n");

  // this has to occur before post, so that layout depth is available for
  // compiling root views
  // bindings should have been registered during `init`
  const router = await $router(app.path.routes, app.extensions);
  app.set(s_layout_depth, router.depth("layout"));

  const i18n_config_path = app.path.config.join("i18n.ts");
  const i18n_config_js_path = app.path.config.join("i18n.js");

  // minimal effort: check if i18n.ts exists (heavier effort during serve)
  const has_i18n_config = await i18n_config_path.exists()
    || await i18n_config_js_path.exists();

  app.i18n_active = has_i18n_config;

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

const js_re = /^.*.js$/;
const jts_re = /^.*.[j|t]s$/;
const write_directories = async (build_directory: FileRef, app: BuildApp) => {
  for (const name of app.server_build) {
    const d = app.runpath(`${name}s`);
    const e = await Promise.all((await FileRef.collect(d, file =>
      js_re.test(file.path)))
      .map(async path => `${path}`.replace(d.toString(), _ => "")));
    const files_js = `
    const ${name} = [];
    ${e.map(path => path.slice(1, -".js".length)).map((bare, i) =>
      `const ${name}${i} = (await import("${FileRef.webpath(`#${name}/${bare}`)}")).default;
    ${name}.push(["${FileRef.webpath(bare)}", ${name}${i}]);`,
    ).join("\n")}
    export default ${name};`;
    await build_directory.join(`${name}s.js`).write(files_js);
  }
};

const write_stores = async (build_directory: FileRef, app: BuildApp) => {
  const d2 = app.path.stores;
  const e = await Promise.all((await FileRef.collect(d2, file =>
    jts_re.test(file.path)))
    .map(async path => `${path}`.replace(d2.toString(), _ => "")));
  const stores_js = `
const store = [];
${e.map(path => path.slice(1, -".js".length)).map((bare, i) =>
    `import * as store${i} from "${FileRef.webpath(`#store/${bare}`)}";
store.push(["${FileRef.webpath(bare)}", store${i}]);`,
  ).join("\n")}

export default store;`;
  await build_directory.join("stores.js").write(stores_js);
};

const write_views = async (build_directory: FileRef, app: BuildApp) => {
  const d2 = app.runpath(location.views);
  const e = await Promise.all((await FileRef.collect(d2, file =>
    js_re.test(file.path)))
    .map(async path => `${path}`.replace(d2.toString(), _ => "")));
  const views_js = `
const view = [];
${e.map(path => path.slice(1, -".js".length)).map((bare, i) =>
    `import * as view${i} from "${FileRef.webpath(`view:${bare}`)}";
view.push(["${FileRef.webpath(bare)}", view${i}]);`,
  ).join("\n")}

${app.roots.map((root, i) => `
import * as root${i} from "${FileRef.webpath(`../server/${root.name}`)}";
view.push(["${root.name.slice(0, -".js".length)}", root${i}]);
`).join("\n")}

export default view;`;
  await build_directory.join("views.js").write(views_js);
};

const write_bootstrap = async (app: BuildApp, mode: string, i18n_active: boolean) => {
  const build_start_script = `
import serve from "primate/serve";
const files = {};
${app.server_build.map(name => `${name}s`).map(name =>
    `import ${name} from "./${app.id}/${name}.js";
     files.${name} = ${name};`,
  ).join("\n")}
${app.mode === "development"
      ? "const views = [];"
      : `import views from "./${app.id}/views.js";`
    }
import routes from "#routes";
files.routes = routes;
import stores from "./${app.id}/stores.js";
import target from "./target.js";
import session from "#session";
import config from "#config/app";
import s_config from "primate/symbol/config";

${i18n_active ? `
import t from "#i18n";
const i18n_config = t[s_config];
` : `
const i18n_config = undefined;
`}

const app = await serve(import.meta.url, {
  ...target,
  config,
  files,
  views,
  stores,
  mode: "${mode}",
  session_config: session[s_config],
  i18n_config,
});

export default app;
`;
  await app.path.build.join("serve.js").write(build_start_script);
};

const post = async (app: BuildApp) => {
  const defaults = FileRef.join(import.meta.url, "../../defaults");

  await app.compile(app.path.routes, "routes", {
    loader: (source, file) => {
      const path = app.basename(file, app.path.routes);
      return wrap(source, path, app.id);
    },
  });

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

  const default_keys = Object.keys(DEFAULT_PATHS);
  for (const [k, v] of Object.entries(app.paths)) {
    if (!default_keys.includes(k) && k.endsWith("*") && v[0].endsWith("/*")) {
      const directory = v[0].slice(0, -"/*".length);
      await app.compile(app.root.join(directory), directory);
    }
  }

  // view components
  if (app.mode !== "development") {
    await app.compile(app.path.views, "views");
  }

  // copy framework pages
  await defaults.copy(app.runpath(location.server, location.pages));
  // copy pages to build
  if (await app.path.pages.exists()) {
    await app.path.pages.copy(app.runpath(location.server, location.pages));
  }

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

  const build_directory = app.path.build.join(app.id);
  // TODO: remove after rcompat automatically creates directories
  await build_directory.create();

  if (app.mode !== "development") {
    await write_views(build_directory, app);
  }
  await write_stores(build_directory, app);
  await write_directories(build_directory, app);
  await write_bootstrap(app, app.mode, app.i18n_active);

  const _imports: Dict<string> = {};

  for (const [alias, targets] of Object.entries(app.paths)) {
    const key = alias.replace(/\/\*$/, "/*");
    const target = targets[0];

    const _target = target.endsWith("*")
      ? `${target}.js`
      : target.split(".").slice(0, -1).join(".").concat(".js");
    _imports[key] = `./${_target}`;
  }

  const manifest_data = {
    ...await (await json()).json() as Dict,
    type: "module",
    imports: _imports,
  };
  // create package.json
  await app.path.build.join("package.json").writeJSON(manifest_data);

  log.system("build written to {0}", app.path.build);

  app.cleanup();

  await bundle_server(app);
  return app;
};

export default async (app: BuildApp) =>
  post(await reducer(app.modules, await pre(app), "build"));
