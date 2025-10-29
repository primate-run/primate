import type BuildApp from "#BuildApp";
import DEFAULT_PATHS from "#DEFAULT_PATHS";
import fail from "#fail";
import location from "#location";
import log from "#log";
import reducer from "#reducer";
import $router from "#request/router";
import wrap from "#route/wrap";
import s_layout_depth from "#symbol/layout-depth";
import FileRef from "@rcompat/fs/FileRef";
import json from "@rcompat/package/json";
import dedent from "@rcompat/string/dedent";
import type Dict from "@rcompat/type/Dict";

const dirname = import.meta.dirname;

const pre = async (app: BuildApp) => {
  // remove build directory in case exists
  await app.path.build.remove();
  await app.path.build.create();

  await Promise.all(["server", "client", "views"]
    .map(directory => app.runpath(directory).create()));

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
  const d2 = app.runpath(location.stores);
  const e = await Promise.all((await FileRef.collect(d2, file =>
    js_re.test(file.path)))
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
    `import * as view${i} from "${FileRef.webpath(`#view/${bare}`)}";
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
import views from "./${app.id}/views.js";
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

  await app.compile(app.path.stores, "stores", {
    resolver: basename => `${basename}.original`, // First pass: save original
  });

  if (await app.path.stores.exists()) {
    const stores = await app.path.stores.collect(({ path }) =>
      app.extensions.some(e => path.endsWith(e)),
    );

    for (const file of stores) {
      const basename = app.basename(file, app.path.stores);
      const wrapper = dedent`
        import database from "#database";
        import store from "./${basename}.original.js";
        import wrap from "primate/database/wrap";
        export default wrap("${basename}", store, database);
      `;

      const target = app.runpath("stores", `${basename}.js`);
      await target.write(wrapper);
    }
  }

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
  await app.compile(app.path.views, "views");

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

  // start the build
  await app.build.start();

  // a target needs to create an `assets.js` that exports assets
  await app.target.run();

  const build_directory = app.path.build.join(app.id);
  // TODO: remove after rcompat automatically creates directories
  await build_directory.create();

  await write_views(build_directory, app);
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

  return app;
};

export default async (app: BuildApp) =>
  post(await reducer(app.modules, await pre(app), "build"));
