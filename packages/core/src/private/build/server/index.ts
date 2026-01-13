import type BuildApp from "#build/App";
import plugin_assets from "#build/server/plugin/assets";
import plugin_config from "#build/server/plugin/config";
import plugin_db_default from "#build/server/plugin/db-default";
import plugin_frontend from "#build/server/plugin/frontend";
import plugin_hot_reload from "#build/server/plugin/hot-reload";
import plugin_native_addons from "#build/server/plugin/native-addons";
import plugin_node_imports from "#build/server/plugin/node-imports";
import plugin_requires from "#build/server/plugin/requires";
import plugin_roots from "#build/server/plugin/roots";
import plugin_route from "#build/server/plugin/route";
import plugin_store from "#build/server/plugin/store";
import plugin_store_wrap from "#build/server/plugin/store-wrap";
import plugin_stores from "#build/server/plugin/stores";
import plugin_view from "#build/server/plugin/view";
import plugin_views from "#build/server/plugin/views";
import plugin_virtual_pages from "#build/server/plugin/virtual-pages";
import plugin_virtual_routes from "#build/server/plugin/virtual-routes";
import plugin_wasm from "#build/server/plugin/wasm";
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
  app.plugin("server", plugin_store(app));
  app.plugin("server", plugin_store_wrap(app));
  app.plugin("server", plugin_db_default(app));
  if (app.mode === "development") app.plugin("server", plugin_hot_reload(app));
  app.plugin("server", plugin_virtual_pages(app));
  app.plugin("server", plugin_virtual_routes(app));
  app.plugin("server", plugin_route(app));
  app.plugin("server", plugin_roots(app));
  app.plugin("server", plugin_views(app));
  app.plugin("server", plugin_assets(app));
  app.plugin("server", plugin_stores(app));
  app.plugin("server", plugin_native_addons(app));
  app.plugin("server", plugin_requires(app));
  app.plugin("server", plugin_config(app));
  app.plugin("server", plugin_wasm(app));

  const options: esbuild.BuildOptions = {
    entryPoints: [app.path.build.join("serve.js").path],
    outfile: app.path.build.join("server.js").path,
    bundle: true,
    platform: "node",
    format: "esm",
    packages: app.mode === "development" ? "external" : undefined,
    external: [...externals[runtime]],
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
    tsconfig: app.root.join("tsconfig.json").path,
    conditions: [
      ...conditions[runtime],
      "module", "import", "runtime", "default",
      ...app.conditions],
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

