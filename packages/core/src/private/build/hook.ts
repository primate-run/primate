import type BuildApp from "#build/App";
import build_client from "#build/client/index";
import build_server from "#build/server/index";
import E from "#errors";
import location from "#location";
import log from "#log";
import $router from "#request/router";
import s_layout_depth from "#symbol/layout-depth";
import assert from "@rcompat/assert";
import c from "@rcompat/cli/color";
import runtime from "@rcompat/runtime";

const package_json = await runtime.packageJSON(import.meta.dirname);
const version = assert.string(package_json.version);

async function pre(app: BuildApp) {
  const build_json = app.path.build.join("build.json");
  const build_path = app.path.build;
  if (await build_path.exists() && !await build_json.exists()) {
    throw E.build_previous_build_exists(build_path);
  }
  await app.path.build.remove();
  await app.path.build.create();
  // early stub in case of build errors
  await app.path.build.join("build.json").writeJSON({});
  await app.runpath(location.client).create();
  const stamp = app.runpath("client", "server-stamp.js");
  await stamp.write("export default 0;\n");
  const router = await $router(app.path.routes, app.extensions);
  app.set(s_layout_depth, router.depth("layout"));
  const i18n_ts = app.path.config.join("i18n.ts");
  const i18n_js = app.path.config.join("i18n.js");
  app.i18n_active = await i18n_ts.exists() || await i18n_js.exists();
  const session_ts = app.path.config.join("session.ts");
  const session_js = app.path.config.join("session.js");
  app.session_active = await session_ts.exists() || await session_js.exists();
}

async function post(app: BuildApp) {
  await build_client(app);
  await build_server(app);

  // write build.json with version and migration_version
  const migrations_dir = app.root.join("migrations");
  let migration_version = 0;
  if (await migrations_dir.exists()) {
    const files = await migrations_dir.files({ filter: /\d+-.*\.[jt]s$/ });
    migration_version = files.length === 0 ? 0 : Math.max(
      ...files.map(f => parseInt(f.name.split("-")[0])),
    );
  }
  // overwrite stub
  await app.path.build.join("build.json").writeJSON({
    version,
    migration_version,
  });

  log.print(`✓ build path  ${c.dim(app.path.build.path)}\n`);
  app.cleanup();
  return app;
}

export default async function run_build_hooks(app: BuildApp) {
  await pre(app);
  await app.build_hooks(app);
  return post(app);
}
