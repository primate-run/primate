import type BuildApp from "#BuildApp";
import copy_includes from "#hook/copy-includes";
import $router from "#hook/router";
import location from "#location";
import log from "#log";
import type Module from "#module/Module";
import s_layout_depth from "#symbol/layout-depth";
import FileRef from "@rcompat/fs/FileRef";
import manifest from "@rcompat/package/manifest";
import stringify from "@rcompat/record/stringify";
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
  const router = await $router(app.path.routes, Object.keys(app.bindings));
  app.set(s_layout_depth, router.depth("layout"));

  return app;
};

const js_re = /^.*.js$/;
const write_directories = async (build_directory: FileRef, app: BuildApp) => {
  for (const name of app.server_build) {
    const d = app.runpath(`${name}s`);
    const e = await Promise.all((await FileRef.collect(d, file => js_re.test(file.path)))
      .map(async path => `${path}`.replace(d.toString(), _ => "")));
    const files_js = `
    const ${name} = [];
    ${e.map(path => path.slice(1, -".js".length)).map((bare, i) =>
      `import * as ${name}${i} from "${FileRef.webpath(`#${name}/${bare}`)}";
    ${name}.push(["${FileRef.webpath(bare)}", ${name}${i}]);`,
    ).join("\n")}
    export default ${name};`;
    await build_directory.join(`${name}s.js`).write(files_js);
  }
};

const write_components = async (build_directory: FileRef, app: BuildApp) => {
  const d2 = app.runpath(location.components);
  const e = await Promise.all((await FileRef.collect(d2, file => js_re.test(file.path)))
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

const write_bootstrap = async (build_number: string, app: BuildApp, mode: string) => {
  const build_start_script = `
import serve from "primate/serve";
const files = {};
${app.server_build.map(name => `${name}s`).map(name =>
  `import ${name} from "./${build_number}/${name}.js";
     files.${name} = ${name};`,
).join("\n")}
import components from "./${build_number}/components.js";
import target from "./target.js";
import session from "#session";
import config from "#config";
import s_config from "primate/symbol/config";

const app = await serve(import.meta.url, {
  ...target,
  config,
  files,
  components,
  mode: "${mode}",
  session_config: session[s_config],
});

export default app;
`;
  await app.path.build.join("serve.js").write(build_start_script);
};

const post = async (app: BuildApp) => {
  const defaults = FileRef.join(import.meta.url, "../../defaults");

  await app.stage2(app.path.routes, "routes", file =>
    `export { default } from "#stage/route${file}";`);

  await app.stage2(app.path.stores, "stores", file =>
    `import db from "#db";
import store from "#stage/store${file}";

export default db.wrap("${file.base}", store);`);

  const configs = FileRef.join(dirname, "../../private/config/config");

  await app.stage2(configs, "config", file =>
    `export { default } from "#stage/config${file}";`);

  await app.stage2(app.path.config, "config", file =>
    `export { default } from "#stage/config${file}";`);

  const { define = {} } = app.config("build");
  const defines = Object.entries(define);
  // stage components, transforming defines
  await app.stage2(app.path.components, "components", file =>
    `export { default } from "#stage/component${file}";`);

  // copy framework pages
  await app.stage(defaults, FileRef.join(location.server, location.pages));
  // overwrite transformed pages to build
  await app.stage(app.path.pages, FileRef.join(location.server, location.pages));

  // copy static files to build/server/static
  await app.stage(app.path.static, FileRef.join(location.server, location.static));

  // publish JavaScript and CSS files
  const imports = await FileRef.collect(app.path.static, file => /\.(?:css)$/.test(file.path));
  await Promise.all(imports.map(async file => {
    const src = file.debase(app.path.static);
    app.build.export(`import "./${location.static}${src}";`);
  }));

  app.build.export(`export { default } from "primate/client/app";`);

  app.build.plugin({
    name: "@primate/core/frontend",
    setup(build) {
      build.onResolve({ filter: /#frontends/ }, ({ path }) => {
        return { path, namespace: `frontends` };
      });
      build.onLoad({ filter: /#frontends/ }, async () => {
        const contents = app.frontends.map(name =>
          `export { default as ${name} } from "@primate/${name}";`).join("\n");
        return { contents, resolveDir: app.root.path };
      });
    },
  });

  // copy additional subdirectories to build/server
  await copy_includes(app, location.server);

  //const components = await app.runpath(location.components).collect();

  // from the build directory, compile to server and client
  //await Promise.all(components.map(component => app.compile(component)));

  // start the build
  await app.build.start();

  // a target needs to create an `assets.js` that exports assets
  await app.runTarget();

  const build_number = crypto.randomUUID().slice(0, 8);
  const build_directory = app.path.build.join(build_number);
  // TODO: remove after rcompat automatically creates directories
  await build_directory.create();

  await write_components(build_directory, app);
  await write_directories(build_directory, app);
  await write_bootstrap(build_number, app, app.mode);

  const manifest_data = {
    ...await manifest() as Dict,
    imports: {
      "#config": "./config/app.js",
      "#locale/*": "./locales/*.js",
      "#db": "./config/db.js",
      "#session": "./config/session.js",
      "#route/*": "./routes/*.js",
      "#store/*": "./stores/*.js",
      "#component/*": "./components/*.js",
      "#stage/config/*": "./stage/config/*.js",
      "#stage/route/*": "./stage/routes/*.js",
      "#stage/store/*": "./stage/stores/*.js",
      "#stage/component/*": "./stage/components/*.js",
    },
  };
  // create package.json
  const package_json = "package.json";
  await app.path.build.join(package_json).write(stringify(manifest_data));

  log.system("build written to {0}", app.path.build);

  app.cleanup();
};

const reducer = async (modules: Module[], app: BuildApp): Promise<BuildApp> => {
  if (modules.length === 0) {
    return app;
  }
  const [first, ...rest] = modules;

  if (rest.length === 0) {
    return await first.build(app, _ => _);
  };
  return await first.build(app, _ => reducer(rest, _));
};

export default async (app: BuildApp) =>
  post(await reducer(app.modules, await pre(app)));
