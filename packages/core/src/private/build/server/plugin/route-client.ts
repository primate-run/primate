import type BuildApp from "#build/App";
import fs from "@rcompat/fs";
import type { Dict } from "@rcompat/type";
import type { Plugin } from "esbuild";

type RouteOptions = { contentType?: string };
type Manifest = Dict<Dict<RouteOptions>>;

const fake_body: Dict<string> = {
  "application/json": `{
    json: () => body,
    text: () => JSON.stringify(body),
    form: () => { throw new Error("cannot parse JSON as form") },
    multipart: () => { throw new Error("cannot parse JSON as multipart") },
    blob: () => new Blob([JSON.stringify(body)]),
  }`,
  "text/plain": `{
    json: () => JSON.parse(body),
    text: () => body,
    form: () => { throw new Error("cannot parse text as form") },
    multipart: () => { throw new Error("cannot parse text as multipart") },
    blob: () => new Blob([body]),
  }`,
  "application/x-www-form-urlencoded": `{
    json: () => { throw new Error("cannot parse form as JSON") },
    text: () => new URLSearchParams(body).toString(),
    //form: () => body,
    form: () => Object.fromEntries(new URLSearchParams(body)),
    multipart: () => ({ form: body, files: [] }),
    blob: () => new Blob([new URLSearchParams(body).toString()]),
  }`,
  "multipart/form-data": `{
    json: () => { throw new Error("cannot parse multipart as JSON") },
    text: () => body,
    form: () => body.form,
    multipart: () => ({
      form: Object.fromEntries([...body.entries()].filter(([, v]) => !(v instanceof File))),
      files: Object.fromEntries([...body.entries()].filter(([, v]) => v instanceof File)),
    }),
    blob: () => new Blob([]),
  }`,
  "application/octet-stream": `{
    json: () => { throw new Error("cannot parse binary as JSON") },
    text: () => body.text(),
    form: () => { throw new Error("cannot parse binary as form") },
    multipart: () => { throw new Error("cannot parse binary as multipart") },
    blob: () => body,
  }`,
};

export default function plugin_server_route_client(app: BuildApp): Plugin {
  return {
    name: "primate/server/route-client",
    setup(build) {
      build.onResolve({ filter: /.*/ }, async args => {
        if (args.pluginData === "primate-server-route-client-inner") return null;
        if (args.namespace === "ignore-failed-check") return null;
        if (args.namespace === "primate-server-route-client") return null;

        const result = await build.resolve(args.path, {
          resolveDir: args.resolveDir,
          kind: args.kind,
          pluginData: "primate-server-route-client-inner",
        });

        if (result.errors.length > 0 || !result.path) return null;

        const resolved = fs.ref(result.path);
        if (!resolved.path.startsWith(app.path.routes.path + "/")) return null;
        if (!args.resolveDir.startsWith(app.path.views.path)) return null;

        const rel = app.basename(resolved, app.path.routes);
        return { path: rel, namespace: "primate-server-route-client" };
      });

      build.onLoad({ filter: /.*/, namespace: "primate-server-route-client" }, async args => {
        const manifest = await app.path.build
          .join("route.manifest.json")
          .json() as Manifest;

        const methods_def = manifest[args.path];
        if (!methods_def) throw new Error(`no manifest entry for ${args.path}`);

        const methods = Object.entries(methods_def).map(([method, { contentType }]) => {
          const arg = contentType ? "{ body }" : "";
          const fake = contentType
            ? `{ body: ${fake_body[contentType] ?? fake_body["application/json"]} }`
            : "{}";

          return `
            ${method}: async (${arg}) => {
              const { handler } = mod.${method};
              const result = await handler(${fake});
              if (result instanceof Blob) {
                return new Response(result, {
                  headers: { "Content-Type": result.type || "application/octet-stream" },
                });
              }
              if (typeof result === "string") {
                return new Response(result, {
                  headers: { "Content-Type": "text/plain" },
                });
              }
              return new Response(JSON.stringify(result), {
                headers: { "Content-Type": "application/json" },
              });
            },
`;
        }).join("\n");

        const contents = `
          import mod from "app:route/${args.path}";
          export default { ${methods} };
        `;

        return { contents, loader: "js", resolveDir: app.root.path };
      });
    },
  };
}
