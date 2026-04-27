import type BuildApp from "#build/App";
import plugin_assets from "#build/server/plugin/assets";
import plugin_config from "#build/server/plugin/config";
import plugin_frontend from "#build/server/plugin/frontend";
import plugin_live_reload from "#build/server/plugin/live-reload";
import plugin_native_addons from "#build/server/plugin/native-addons";
import plugin_node_imports from "#build/server/plugin/node-imports";
import plugin_requires from "#build/server/plugin/requires";
import plugin_roots from "#build/server/plugin/roots";
import plugin_route from "#build/server/plugin/route";
import plugin_stores from "#build/server/plugin/stores";
import plugin_view from "#build/server/plugin/view";
import plugin_views from "#build/server/plugin/views";
import plugin_virtual_pages from "#build/server/plugin/virtual-pages";
import plugin_virtual_routes from "#build/server/plugin/virtual-routes";
import plugin_wasm from "#build/server/plugin/wasm";
import plugin_app_request from "#build/shared/plugin/app-request";
import plugin_route_client from "#build/server/plugin/route-client";
import runtime from "@rcompat/runtime";
import * as esbuild from "esbuild";

const externals = {
  node: ["node:*"],
  bun: ["node:*", "bun:*"],
  deno: ["node:*"],
};
const conditions = {
  node: ["node"],
  bun: ["bun", "node"],
  deno: ["deno", "node"],
};

export default async function build_server(app: BuildApp) {
  app.plugin("server", plugin_node_imports(app));
  app.plugin("server", plugin_frontend(app));
  app.plugin("server", plugin_view(app));
  if (app.mode === "development") app.plugin("server", plugin_live_reload(app));
  app.plugin("server", plugin_virtual_pages(app));
  app.plugin("server", plugin_virtual_routes(app));
  app.plugin("server", plugin_route_client(app));
  app.plugin("server", plugin_route(app));
  app.plugin("server", plugin_roots(app));
  app.plugin("server", plugin_views(app));
  app.plugin("server", plugin_assets(app));
  app.plugin("server", plugin_stores(app));
  app.plugin("server", plugin_native_addons(app));
  app.plugin("server", plugin_requires(app));
  app.plugin("server", plugin_config(app));
  app.plugin("server", plugin_wasm(app));
  app.plugin("server", plugin_app_request(app));

  const runtime_name = runtime.name as keyof typeof externals;

  const tsconfig_json = app.root.join("tsconfig.json");
  const options: esbuild.BuildOptions = {
    entryPoints: [app.path.build.join("serve.js").path],
    outfile: app.path.build.join("server.js").path,
    bundle: true,
    platform: "node",
    format: "esm",
    packages: app.mode === "development" ? "external" : undefined,
    external: [...externals[runtime_name]],
    loader: {
      ".json": "json",
    },
    banner: {
      js: `
        import { createRequire as __createRequire } from "node:module";
        const require = __createRequire(import.meta.url);
      `,
    },
    nodePaths: [app.root.join("node_modules").path],
    resolveExtensions: app.extensions,
    absWorkingDir: app.root.path,
    ...await tsconfig_json.exists() ? { tsconfig: tsconfig_json.path } : {},
    conditions: [
      ...conditions[runtime_name],              // node | deno | bun
      ...app.conditions,                        // set by modules
      ...app.config("conditions"),              // set by user,
      "module", "import", "runtime", "default", // defaults
    ],
    plugins: app.plugins("server"),
    write: app.mode !== "development",
  };
  if (app.mode === "development") {
    const context = await esbuild.context(options);
    await context.watch();
  } else {
    await esbuild.build(options);
  }
}

