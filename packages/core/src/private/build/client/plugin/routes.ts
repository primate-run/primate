import type BuildApp from "#build/App";
import E from "#errors";
import fs from "@rcompat/fs";
import type { Dict } from "@rcompat/type";
import type { Plugin } from "esbuild";

type RouteOptions = { contentType?: string };
type Manifest = Dict<Dict<RouteOptions>>;

const body_serializer: Dict<string> = {
  "application/json": "JSON.stringify(body)",
  "application/x-www-form-urlencoded": "new URLSearchParams(body).toString()",
  "multipart/form-data": "body",
  "text/plain": "body",
  "application/octet-stream": "body",
};

export default function plugin_client_routes(app: BuildApp): Plugin {
  let manifest: Manifest | undefined;

  async function get_manifest(): Promise<Manifest> {
    if (manifest === undefined) {
      manifest = await app.path.build
        .join("route.manifest.json")
        .json() as Manifest;
    }
    return manifest;
  }

  return {
    name: "primate/client/routes",
    setup(build) {
      build.onStart(() => {
        manifest = undefined;
      });

      build.onResolve({ filter: /.*/ }, async args => {
        if (args.pluginData === "primate-client-route-inner") return null;

        const result = await build.resolve(args.path, {
          resolveDir: args.resolveDir,
          kind: args.kind,
          pluginData: "primate-client-route-inner",
        });

        if (result.errors.length > 0 || !result.path) return null;

        const resolved = fs.ref(result.path);
        if (!resolved.path.startsWith(app.path.routes.path + "/")) return null;

        const rel = app.basename(resolved, app.path.routes);
        return { path: rel, namespace: "primate-client-route" };
      });

      build.onLoad({ filter: /.*/, namespace: "primate-client-route" }, async args => {
        const manifest = await get_manifest();
        const methods_def = manifest[args.path];
        if (!methods_def) throw new Error(`no manifest entry for ${args.path}`);

        if (args.path.includes("[")) throw E.build_no_path_schema(args.path);

        const methods = Object.entries(methods_def).map(([method, { contentType }]) => {
          const arg = contentType ? "{ body }" : "";
          const headers = contentType && contentType !== "multipart/form-data"
            ? `{ "Content-Type": "${contentType}" }`
            : "{}";
          const body_str = contentType !== undefined
            ? (body_serializer[contentType] ?? "body")
            : "undefined";

          const method_fn = `async (${arg}) => fetch("/${args.path}", {
            method: "${method.toUpperCase()}",
            headers: ${headers},
            ${contentType ? `body: ${body_str},` : ""}
          })`;

          return `
            ${method}: Object.assign(${method_fn}, {
              contentType: ${contentType ? `"${contentType}"` : "undefined"},
            }),
          `;
        }).join("\n");

        const contents = `export default { ${methods} };`;
        return { contents, loader: "js", resolveDir: app.root.path };
      });
    },
  };
}
