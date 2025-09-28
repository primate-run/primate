import AppError from "#AppError";
import type BuildApp from "#BuildApp";
import location from "#location";
import log from "#log";
import reducer from "#reducer";
import $router from "#request/router";
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

  await Promise.all(["server", "client", "components"]
    .map(directory => app.runpath(directory).create()));

  // this has to occur before post, so that layout depth is available for
  // compiling root components
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

async function indexDatabase(base: FileRef) {
  const export_from = "export { default } from";
  const default_database = `${export_from} "#stage/config/database/index.js";`;

  // app/config/database does not exist
  if (!await base.exists()) return default_database;

  const databases = await base.list();
  const n = databases.length;

  // none in app/config/database -> fallback
  if (n === 0) return default_database;

  // index database file found, will be overwritten in next step
  if (databases.some(d => d.base === "index")) return "";

  const names = databases.map(d => d.name);

  // app/config/database/default.ts -> use
  const ts = names.includes("default.ts");
  if (ts) return `${export_from} "#stage/config/database/default.ts";`;

  // app/config/database/default.js -> use
  const js = names.includes("default.js");
  if (js) return `${export_from} "#stage/config/database/default.js";`;

  // one in app/config/database -> default
  if (n === 1) return `${export_from} "#stage/config/database/${names[0]}";`;

  throw new AppError(
    "Multiple database drivers; add index or default.(ts|js). Found: {0}",
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

const write_components = async (build_directory: FileRef, app: BuildApp) => {
  const d2 = app.runpath(location.components);
  const e = await Promise.all((await FileRef.collect(d2, file =>
    js_re.test(file.path)))
    .map(async path => `${path}`.replace(d2.toString(), _ => "")));
  const components_js = `
const component = [];
${e.map(path => path.slice(1, -".js".length)).map((bare, i) =>
    `import * as component${i} from "${FileRef.webpath(`#component/${bare}`)}";
component.push(["${FileRef.webpath(bare)}", component${i}]);`,
  ).join("\n")}

${app.roots.map((root, i) => `
import * as root${i} from "${FileRef.webpath(`../server/${root.name}`)}";
component.push(["${root.name.slice(0, -".js".length)}", root${i}]);
`).join("\n")}

export default component;`;
  await build_directory.join("components.js").write(components_js);
};

const write_bootstrap = async (app: BuildApp, mode: string, i18n_active: boolean) => {
  const build_start_script = `
import serve from "primate/serve";
const files = {};
${app.server_build.map(name => `${name}s`).map(name =>
    `import ${name} from "./${app.id}/${name}.js";
     files.${name} = ${name};`,
  ).join("\n")}
import components from "./${app.id}/components.js";
import stores from "./${app.id}/stores.js";
import target from "./target.js";
import session from "#session";
import config from "#config";
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
  components,
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

  await app.stage(app.path.routes, "routes", file => dedent`
    export * from "#stage/route${file}";
  `);

  await app.stage(app.path.stores, "stores", file => dedent`
    import database from "#database";
    import store from "#stage/store${file}";
    import wrap from "primate/database/wrap";

    export default await wrap("${file.base}", store, database);
  `);

  const configs = FileRef.join(dirname, "../../private/config/config");
  const database_base = app.path.config.join("database");

  await app.stage(configs, "config", async file => {
    if (file.path === "/database/index.js") return indexDatabase(database_base);

    return `export { default } from "#stage/config${file}";`;
  });

  await app.stage(app.path.modules, "modules", file =>
    `export { default } from "#stage/module${file}";`);

  // stage locales
  await app.stage(app.path.locales, "locales", file =>
    `export { default } from "#stage/locale${file}";`);

  // stage app config after locales so #locale imports can be resolved
  await app.stage(app.path.config, "config", file =>
    `export { default } from "#stage/config${file}";`,
  );

  // stage components
  await app.stage(app.path.components, "components", file => `
    import * as component from "#stage/component${file}";

    export * from "#stage/component${file}";
    export default component?.default;
  `);

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

  app.build.export("export { default } from \"primate/client/app\";");

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

  await write_components(build_directory, app);
  await write_stores(build_directory, app);
  await write_directories(build_directory, app);
  await write_bootstrap(app, app.mode, app.i18n_active);

  const manifest_data = {
    ...await (await json()).json() as Dict,
    type: "module",
    imports: {
      "#config": "./config/app.js",
      "#config/*": "./config/*.js",
      "#database": "./config/database/index.js",
      "#database/*": "./config/database/*.js",
      "#session": "./config/session.js",
      "#i18n": "./config/i18n.js",
      "#component/*": "./components/*.js",
      "#locale/*": "./locales/*.js",
      "#module/*": "./modules/*.js",
      "#route/*": "./routes/*.js",
      "#stage/component/*": "./stage/components/*.js",
      "#stage/locale/*": "./stage/locales/*.js",
      "#stage/config/*": "./stage/config/*.js",
      "#stage/module/*": "./stage/modules/*.js",
      "#stage/route/*": "./stage/routes/*.js",
      "#stage/store/*": "./stage/stores/*.js",
      "#store/*": "./stores/*.js",
    },
  };
  // create package.json
  await app.path.build.join("package.json").writeJSON(manifest_data);

  log.system("build written to {0}", app.path.build);

  app.cleanup();

  return app;
};

export default async (app: BuildApp) =>
  post(await reducer(app.modules, await pre(app), "build"));
