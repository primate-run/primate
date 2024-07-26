import { cascade } from "rcompat/async";
import Build from "rcompat/build";
import { dim } from "rcompat/colors";
import { File } from "rcompat/fs";
import * as O from "rcompat/object";
import * as loaders from "../loaders/exports.js";
import copy_includes from "./copy_includes.js";
import $router from "./router.js";
import * as P from "rcompat/package";

const html = /^.*.html$/u;

const pre = async (app, mode, target) => {
  if (app.targets[target] === undefined) {
    throw new Error(`target ${dim(target)} does not exist`);
  }
  app.log.system(`starting ${dim(target)} build in ${dim(mode)} mode`);

  app.build = new Build({
    ...O.exclude(app.get("build"), ["includes", "index", "transform"]),
    outdir: app.runpath(app.get("location.client")).path,
    stdin: {
      resolveDir: app.path.build.path,
    },
  }, mode);
  app.server_build = ["routes", "types"];

  // remove build directory in case exists
  await app.path.build.remove();
  await app.path.build.create();

  await Promise.all(["server", "client", "pages", "components"]
    .map(directory => app.runpath(directory).create()));

  const router = await $router(app.path.routes);
  const layout = { depth: router.depth("layout") };
  app.set("layout", layout);

  return { ...app, layout };
};

const js_re = /^.*.js$/u;
const write_directories = async (build_directory, app) => {
  for (const name of app.server_build) {
    const d = app.runpath(name);
    const e = await Promise.all((await File.collect(d, js_re, { recursive: true }))
      .map(async file => `${file}`.replace(d, _ => "")));
    const files_js = `
    const ${name} = [];
    ${e.map((file , i) =>
    `import * as ${name}${i} from "../${name}${file}";
    ${name}.push(["${file.slice(1, -".js".length)}", ${name}${i}]);`,
  ).join("\n")}
    export default ${name};`;
    await build_directory.join(`${name}.js`).write(files_js);
  }
};

const write_components = async (build_directory, app) => {
  const location = app.get("location");
  const d2 = app.runpath(location.server, location.components);
  const e = await Promise.all((await File.collect(d2, js_re, { recursive: true }))
    .map(async file => `${file}`.replace(d2, _ => "")));
  const components_js = `
const components = [];
${e.map((component, i) =>
    `import * as component${i} from "../server/components${component}";
components.push(["${component.slice(1, -".js".length)}", component${i}]);`,
  ).join("\n")}

${app.roots.map((root, i) => `
import * as root${i} from "${root}";
components.push(["${root.name}", root${i}]);
`).join("\n")}

export default components;`;
  await build_directory.join("components.js").write(components_js);
};

const write_bootstrap = async (build_number, app) => {
  const build_start_script = `
import { File } from "rcompat/fs";
import serve from "@primate/core/serve";
import config from "./primate.config.js";
const files = {};
${app.server_build.map(name =>
    `import ${name} from "./${build_number}/${name}.js";
     files.${name} = ${name};`,
  ).join("\n")}
import components from "./${build_number}/components.js";
import * as target from "./target.js";

await serve(new File(import.meta.url).directory, {
  ...target,
  config,
  files,
  components,
});`;
  await app.path.build.join("serve.js").write(build_start_script);
};

const post = async (app, target) => {
  const location = app.get("location");
  const defaults = new File(import.meta.dirname).join("../defaults");

  await Promise.all(["routes", "types", "components"].map(directory =>
    app.stage(app.path[directory], location[directory])));

  const user_types = await loaders.types(app.log, app.runpath(location.types));
  const types = { ...app.types, ...user_types };

  const directory = app.runpath(location.routes);
  for (const path of await directory.collect()) {
    await app.bindings[path.extension]
      ?.(directory, path.debase(`${directory}/`), types);
  }
  // copy framework pages
  await app.stage(defaults, location.pages, html);
  // overwrite transformed pages to build
  await app.stage(app.path.pages, location.pages, html);

  // copy static files to build/server/static
  await app.stage(app.path.static, File.join(location.server, location.static));

  // copy static files to build/static
  await app.stage(app.path.static, File.join(location.static));

  // publish JavaScript and CSS files
  const imports = await File.collect(app.path.static, /\.(?:css)$/u);
  await Promise.all(imports.map(async file => {
    const src = file.debase(app.path.static);
    app.build.export(`import "./${location.static}${src}";`);
  }));

  // copy additional subdirectories to build/server
  await copy_includes(app, location.server);
  // copy additional subdirectories to build
  await copy_includes(app, "");

  const components = await app.runpath(location.components).collect();

  // from the build directory, compile to server and client
  await Promise.all(components.map(component => app.compile(component)));

  // start the build
  await app.build.start();

  // a target needs to create an `assets.js` that exports assets
  await app.targets[target](app);

  const build_number = crypto.randomUUID().slice(0, 8);
  const build_directory = app.path.build.join(build_number);
  // TODO: remove after rcompat automatically creates directories
  await build_directory.create();

  await write_components(build_directory, app);
  await write_directories(build_directory, app);
  await write_bootstrap(build_number, app);

  // copy config file
  const config = "primate.config.js";
  await app.root.join(config).copy(app.path.build.join(config));

  const manifest = await P.manifest();
  // create package.json
  const package_json = "package.json";
  await app.path.build.join(package_json).write(O.stringify(manifest));

  app.log.system(`build written to ${dim(app.path.build)}`);

};

export default async (app, mode = "development", target = "web") =>
  post(await (await cascade(app.modules.build))(await pre(app, mode, target)), target);
