import build_client from "#build/client/index";
import build_server from "#build/server/index";
import type BuildApp from "#build/App";
import fail from "#fail";
import location from "#location";
import log from "#log";
import reducer from "#reducer";
import $router from "#request/router";
import s_layout_depth from "#symbol/layout-depth";
import pkg from "@rcompat/fs/project/package";

const core_pkg = await pkg(import.meta.url);
const { version } = await core_pkg.json() as { version: string };

async function pre(app: BuildApp) {
  const dot_primate = app.path.build.join(".primate");
  if (await app.path.build.exists() && !await dot_primate.exists()) {
    const message = "{0} exists but does not contain a previous build";
    throw fail(message, app.path.build.path);
  }
  // remove build directory if exists
  await app.path.build.remove();
  await app.path.build.create();
  // touch a .primate file to indicate this is a Primate build directory
  await dot_primate.write(version);

  await app.runpath(location.client).create();
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

async function post(app: BuildApp) {
  await build_client(app);
  await build_server(app);

  log.system("build written to {0}", app.path.build);

  app.cleanup();

  return app;
};

export default async (app: BuildApp) =>
  post(await reducer(app.modules, await pre(app), "build"));
