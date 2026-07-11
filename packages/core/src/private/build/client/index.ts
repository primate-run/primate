import type BuildApp from "#build/App";
import plugin_alias from "#build/client/plugin/alias";
import plugin_entrypoint from "#build/client/plugin/entrypoint";
import plugin_frontend from "#build/client/plugin/frontend";
import plugin_route_module from "#build/client/plugin/route-module";
import plugin_route_view from "#build/client/plugin/route-view";
import plugin_routes from "#build/client/plugin/routes";
import plugin_server_stamp from "#build/client/plugin/server-stamp";
import plugin_view from "#build/client/plugin/view";
import plugin_app_request from "#build/shared/plugin/app-request";
import E from "#errors";
import location from "#location";
import { CodeError } from "@rcompat/error";
import * as esbuild from "esbuild";

const write_bootstrap = async (app: BuildApp) => {
  const migrate_auto = app.config("db.migrations")?.autoapply === true;
  const build_start_script = `
    import serve from "primate/serve";
    import views from "app:views";
    import pages from "app:pages";
    import routes from "app:routes";
    import templates from "app:templates";
    import assets from "app:assets";
    ${migrate_auto ? `import migrations from "app:migrations";` : ""}
    ${migrate_auto ? `import autoapply from "app:migrations/autoapply";` : ""}
    import s_config from "primate/symbol/config";
    ${app.session_active ? `
    import session from "app:config:session";
    const session_config = session[s_config];
    ` : `
    const session_config = undefined;
    `}
    import facade from "$:app";

    ${migrate_auto ? `await autoapply(facade, migrations);` : ""}

    const app = await serve(import.meta.url, {
      assets,
      facade,
      routes,
      views,
      pages,
      templates,
      session: session_config,
      mode: "${app.mode}",
      target: "${app.target.name}",
      log: "${app.log.level}"
    });

    export default app;
  `;
  await app.path.build.join("serve.js").write(build_start_script);
};

function user_entrypoints(app: BuildApp) {
  const configured = app.config("entrypoints") ?? {};
  const reserved = ["app", "head", "body"];

  const conflicts = Object.keys(configured).filter(name => reserved.includes(name));

  if (conflicts.length) throw E.build_reserved_entrypoints(conflicts);

  return Object.fromEntries(
    Object.entries(configured).map(([name, file]) => [
      name,
      app.path.client.join(file).path,
    ]),
  );
}

export default async function build_client(app: BuildApp) {
  app.plugin("client", plugin_frontend(app));
  app.plugin("client", plugin_alias(app));
  app.plugin("client", plugin_view(app));
  app.plugin("client", plugin_app_request(app));
  app.plugin("client", plugin_route_view(app));
  app.plugin("client", plugin_route_module(app));
  app.plugin("client", plugin_routes(app));
  app.plugin("client", plugin_server_stamp(app));
  app.plugin("client", plugin_entrypoint(app));

  app.entrypoint("import \"primate/client/app\";");

  const tsconfig = app.root.join("tsconfig.json");
  const conditions = app.conditions.values();
  const build_options: esbuild.BuildOptions = {
    plugins: app.plugins("client"),
    outdir: app.runpath(location.client).path,
    entryPoints: {
      app: "app:client",
      ...user_entrypoints(app),
    },
    conditions: ["style", "browser", "default", "module", ...conditions],
    resolveExtensions: [".ts", ".js", ...app.extensions("frontend", { client: true })],
    ...await tsconfig.exists() ? { tsconfig: tsconfig.path } : {},
    bundle: true,
    format: "esm",
    logLevel: "silent",
    loader: app.config("loaders"),
  };

  if (app.mode === "development") {
    const NO_HR = app.config("livereload.exclude") ?? [];

    app.entrypoint(`
    const NO_HR = ${JSON.stringify(NO_HR)};
    new EventSource("/esbuild").addEventListener("change", () => {
      if (!NO_HR.includes(location.pathname)) location.reload();
    });
  `);
  }

  const mode_options: esbuild.BuildOptions = app.mode === "development"
    ? {
      entryNames: "[name]",
      minify: false,
      splitting: false,
    }
    : {
      entryNames: "[name]-[hash]",
      minify: true,
      splitting: true,
    };

  const options: esbuild.BuildOptions = { ...build_options, ...mode_options };

  try {
    if (app.mode === "development") {
      const context = await esbuild.context(options);
      await context.watch();
      await context.rebuild();
      await context.serve(app.livereload);
    } else {
      await esbuild.build(options);
    }
  } catch (cause: any) {
    const original = cause?.errors?.[0]?.detail;
    if (CodeError.is(original)) throw original;
    throw cause;
  }

  await write_bootstrap(app);
}
