import type BuildApp from "#build/App";
import intercept from "#build/shared/intercept";
import fs from "@rcompat/fs";
import type { Plugin } from "esbuild";

export default function plugin_server_route_client(app: BuildApp): Plugin {
  return {
    name: "primate/server/route-client",
    setup(build) {
      build.onResolve({ filter: /.*/ }, async args => {
        if (args.pluginData === "primate-server-route-client-inner") return null;
        if (args.namespace === "primate-server-route-client") return null;
        if (intercept(args, app.path.views)) return null;

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

        return {
          path: rel,
          namespace: "primate-server-route-client",
        };
      });

      build.onLoad({ filter: /.*/, namespace: "primate-server-route-client" }, async args => {
        const contents = `
          import mod from "app:route/${args.path}";

          function fake_body(contentType, body) {
            switch (contentType) {
              case "application/json":
                return {
                  json: () => body,
                  text: () => JSON.stringify(body),
                  form: () => { throw new Error("cannot parse JSON as form"); },
                  multipart: () => { throw new Error("cannot parse JSON as multipart"); },
                  blob: () => new Blob([JSON.stringify(body)]),
                };

              case "text/plain":
                return {
                  json: () => JSON.parse(body),
                  text: () => body,
                  form: () => { throw new Error("cannot parse text as form"); },
                  multipart: () => { throw new Error("cannot parse text as multipart"); },
                  blob: () => new Blob([body]),
                };

              case "application/x-www-form-urlencoded":
                return {
                  json: () => { throw new Error("cannot parse form as JSON"); },
                  text: () => new URLSearchParams(body).toString(),
                  form: () => Object.fromEntries(new URLSearchParams(body)),
                  multipart: () => ({ form: body, files: [] }),
                  blob: () => new Blob([new URLSearchParams(body).toString()]),
                };

              case "multipart/form-data":
                return {
                  json: () => { throw new Error("cannot parse multipart as JSON"); },
                  text: () => body,
                  form: () => body.form,
                  multipart: () => ({
                    form: Object.fromEntries([...body.entries()].filter(([, v]) => !(v instanceof File))),
                    files: Object.fromEntries([...body.entries()].filter(([, v]) => v instanceof File)),
                  }),
                  blob: () => new Blob([]),
                };

              case "application/octet-stream":
                return {
                  json: () => { throw new Error("cannot parse binary as JSON"); },
                  text: () => body.text(),
                  form: () => { throw new Error("cannot parse binary as form"); },
                  multipart: () => { throw new Error("cannot parse binary as multipart"); },
                  blob: () => body,
                };

              default:
                return {
                  json: () => body,
                  text: () => JSON.stringify(body),
                  form: () => { throw new Error("cannot parse body as form"); },
                  multipart: () => { throw new Error("cannot parse body as multipart"); },
                  blob: () => new Blob([JSON.stringify(body)]),
                };
            }
          }

          function fake_request(contentType, body) {
            return contentType === undefined
              ? {}
              : { body: fake_body(contentType, body) };
          }

          function to_response(result) {
            if (result instanceof Response) {
              return result;
            }

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

            if (result === null || result === undefined) {
              return new Response(null, { status: 204 });
            }

            return new Response(JSON.stringify(result), {
              headers: { "Content-Type": "application/json" },
            });
          }

          export default Object.fromEntries(
            Object.entries(mod).map(([method, route]) => {
              const contentType = route.options?.contentType;

              const client_method = async ({ body } = {}) => {
                const result = await route.handler(fake_request(contentType, body));
                return to_response(result);
              };

              return [
                method,
                Object.assign(client_method, { contentType }),
              ];
            }),
          );
        `;

        return {
          contents,
          loader: "js",
          resolveDir: app.root.path,
        };
      });
    },
  };
}
