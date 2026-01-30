import type BuildApp from "#build/App";
import plugin_alias from "#build/client/plugin/alias";
import plugin_entrypoint from "#build/client/plugin/entrypoint";
import plugin_frontend from "#build/client/plugin/frontend";
import plugin_server_stamp from "#build/client/plugin/server-stamp";
import reload from "#build/client/reload";
import location from "#location";
import * as esbuild from "esbuild";

const write_bootstrap = async (app: BuildApp, mode: string) => {
  const build_start_script = `
    import serve from "primate/serve";
    import views from "app:views";
    import routes from "app:routes";
    import pages from "app:pages";
    import assets from "app:assets";
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

    const app = await serve(import.meta.url, {
      assets,
      config,
      routes,
      views,
      pages,
      mode: "${mode}",
      session_config,
      i18n_config,
      target: "${app.target.name}",
    });

    export default app;
  `;
  await app.path.build.join("serve.js").write(build_start_script);
};

export default async function build_client(app: BuildApp) {
  app.plugin("client", plugin_frontend(app));
  app.plugin("client", plugin_alias(app));
  app.plugin("client", plugin_server_stamp(app));
  app.plugin("client", plugin_entrypoint(app));

  const imports = await app.path.static.files({
    recursive: true,
    filter: file => /\.(?:js|ts|css)$/.test(file.path),
  });
  imports.forEach(file => {
    const src = file.debase(app.path.static);
    app.entrypoint(`import "./${location.static}${src}";`);
  });
  app.entrypoint("import \"primate/client/app\";");

  const conditions = app.conditions.values();
  const build_options: esbuild.BuildOptions = {
    plugins: app.plugins("client"),
    outdir: app.runpath(location.client).path,
    entryPoints: ["app:client"],
    conditions: ["style", "browser", "default", "module", ...conditions],
    resolveExtensions: [".ts", ".js", ...app.frontendExtensions],
    tsconfig: app.root.join("tsconfig.json").path,
    bundle: true,
    format: "esm",
  };
  const NO_HR = app.config("hotreload.exclude") ?? [];
  const mode_options: esbuild.BuildOptions = app.mode === "development"
    ? {
      banner: {
        js: `const NO_HR=${JSON.stringify(NO_HR)};
          new EventSource("${reload.path}").addEventListener("change",
          () => !NO_HR.includes(location.pathname) && location.reload());`,
      },
      entryNames: "app",
      minify: false,
      splitting: false,
    }
    : {
      entryNames: "app-[hash]",
      minify: true,
      splitting: true,
    };
  const options: esbuild.BuildOptions = { ...build_options, ...mode_options };

  if (app.mode === "development") {
    const context = await esbuild.context(options);
    await context.watch();
    await context.rebuild();
    await context.serve({ host: reload.host, port: reload.port });
  } else {
    await esbuild.build(options);
  }

  await write_bootstrap(app, app.mode);
}
