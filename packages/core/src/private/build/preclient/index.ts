import type BuildApp from "#build/App";
import plugin_preclient_routes from "#build/preclient/plugin/routes";
import plugin_assets from "#build/server/plugin/assets";
import plugin_config from "#build/server/plugin/config";
import plugin_frontend from "#build/server/plugin/frontend";
import plugin_native_addons from "#build/server/plugin/native-addons";
import plugin_node_imports from "#build/server/plugin/node-imports";
import plugin_requires from "#build/server/plugin/requires";
import plugin_roots from "#build/server/plugin/roots";
import plugin_server_route from "#build/server/plugin/route";
import plugin_stores from "#build/server/plugin/stores";
import plugin_view from "#build/server/plugin/view";
import plugin_views from "#build/server/plugin/views";
import plugin_virtual_pages from "#build/server/plugin/virtual-pages";
import plugin_wasm from "#build/server/plugin/wasm";
import plugin_app_request from "#build/shared/plugin/app-request";
import type { Dict, JSONValue } from "@rcompat/type";
import * as esbuild from "esbuild";

type RouteOptions = { contentType?: string; body?: JSONValue };
type Manifest = Dict<Dict<RouteOptions>>;

export default async function build_preclient(app: BuildApp) {
  const tsconfig_json = app.root.join("tsconfig.json");
  const preclient = app.path.build.join("preclient.js");

  const plugins = [
    plugin_preclient_routes(app),
    plugin_node_imports(app),
    plugin_frontend(app),
    plugin_view(app),
    plugin_virtual_pages(app),
    plugin_server_route(app),
    plugin_roots(app),
    plugin_views(app),
    plugin_assets(app),
    plugin_stores(app),
    plugin_native_addons(app),
    plugin_requires(app),
    plugin_config(app),
    plugin_wasm(app),
    plugin_app_request(app),
    ...app.plugins("server"),
  ];

  await esbuild.build({
    entryPoints: ["app:preclient-routes"],
    bundle: true,
    write: true,
    outfile: preclient.path,
    format: "esm",
    platform: "node",
    packages: "external",
    resolveExtensions: app.extensions,
    absWorkingDir: app.root.path,
    ...await tsconfig_json.exists() ? { tsconfig: tsconfig_json.path } : {},
    conditions: ["node", "module", "import", "default"],
    plugins,
  });

  const bundle = await preclient.import("default") as Dict<Dict<{
    options?: { contentType?: string; body?: unknown };
  }>>;

  const manifest: Manifest = {};
  for (const [path, methods] of Object.entries(bundle)) {
    manifest[path] = Object.fromEntries(
      Object.entries(methods).map(([method, { options }]) => [
        method, {
          ...(options?.contentType !== undefined && {
            contentType: options.contentType,
          }),
          ...(options?.body !== undefined && {
            body: (options.body as { toJSON(): JSONValue }).toJSON(),
          }),
        },
      ]),
    );
  }

  await preclient.remove();
  await app.path.build.join("route.manifest.json").writeJSON(manifest);
}
