import type App from "#App";
import type BuildApp from "#build/App";
import type ClientData from "#client/Data";
import type Render from "#client/Render";
import type ServerData from "#client/ServerData";
import type ServerView from "#client/ServerView";
import type View from "#client/View";
import type ViewOptions from "#client/ViewOptions";
import E from "#errors";
import inline from "#inline";
import location from "#location";
import type Mode from "#Mode";
import type Module from "#Module";
import type RequestFacade from "#request/RequestFacade";
import type ResponseFunction from "#response/ResponseFunction";
import type ServeApp from "#serve/App";
import hash from "@rcompat/crypto/hash";
import fn from "@rcompat/fn";
import type { FileRef } from "@rcompat/fs";
import fs from "@rcompat/fs";
import { MIME, Status } from "@rcompat/http";
import type { Dict, MaybePromise, Unpack } from "@rcompat/type";
import type { ObjectType } from "pema";
import p from "pema";

export type { Module };

const base_schema = p({
  extensions: p.array(p.string).optional(),
  spa: p.boolean.default(true),
  ssr: p.boolean.default(true),
});

type C = typeof base_schema.Complement;
type Options<E extends C> = typeof base_schema.infer & E["infer"];
type On<A, E extends C> = (app: A, options: Options<E>) => MaybePromise<void>;

export interface Init<
  S = ServerView,
  E extends C = ObjectType<never>> {
  name: string;
  extensions: string[];
  layouts: boolean;
  client: boolean;
  conditions?: string[];
  render?: Render<S>;
  root?: {
    create: (depth: number, i18n_active: boolean) => string;
  };
  compile?: {
    client?: (text: string, file: FileRef, root: boolean) =>
      MaybePromise<{ css?: null | string; js: string }>;
    server?: (text: string, file: FileRef) => MaybePromise<string>;
  };
  css?: {
    filter: RegExp;
  };
  transform?: (input: {
    body: string;
    head: string;
    headers: Dict<string>;
    app: ServeApp;
    options: ViewOptions;
    request: RequestFacade;
  }) => MaybePromise<{
    body: string;
    head?: string;
    headers?: Dict<string>;
    partial?: boolean;
  }>;
  schema?: E;
  onInit?: On<App, E>;
  onBuild?: On<BuildApp, E>;
  onServe?: On<ServeApp, E>;
}

type Layout = (app: ServeApp, transfer: Dict, request: RequestFacade) => View;

export default function frontend_module<
  S = ServerView,
  E extends C = ObjectType<never>,
>(init: Init<S, E>) {
  const _render: Render<S> = init.render ?? (async (view, props) =>
    ({ body: await (view as ServerView)(props) }));
  const rootname = `root_${init.name}`;
  const module_name = init.name;
  const conditions = init.conditions ?? [];
  const schema = base_schema.extend(init.schema ?? {} as E);

  async function normalize(path: string) {
    const file = fs.ref(path);
    const basename = path.slice(0, -file.fullExtension.length);
    return `p_${await hash(`${basename}.${module_name}`)}`;
  }

  type MergedInput<I extends C> = I extends ObjectType<never>
    ? typeof base_schema.input
    : Unpack<typeof base_schema.input & I["input"]>;

  return (input?: MergedInput<E>): Module => {
    const options = schema.parse(input);
    const spa = options.spa;
    const extensions = options.extensions ?? init.extensions;
    let mode: Mode = "development";

    function ssr() {
      return options.ssr && (mode !== "development" || !init.client);
    }

    function load(name: string, props: Dict, app: ServeApp) {
      if (!ssr()) return { view: null, name, props };
      const view = app.loadView(name)!;
      return { view, name, props };
    }

    async function render(server: ServerData<S>, client: ClientData, app: ServeApp) {
      const { body, head = "", headers = {} } = ssr()
        ? await _render(server.view, server.props)
        : { body: "", head: "" };

      if (!init.client) {
        if (app.mode === "development") {
          const asset = app.assets.find(a =>
            a.src?.includes("app") && a.src.endsWith(".js"),
          );
          if (asset === undefined) throw E.frontend_missing_app_js();
          const app_script = `<script type="module" src="${asset.src}"></script>`;
          return { body, head: head.concat(app_script), headers };
        }
        return { body, head, headers };
      }

      const app_asset = app.assets.find(asset =>
        asset.src?.includes("app") && asset.src.endsWith(".js"),
      );

      if (app_asset === undefined) throw E.frontend_missing_app_js();

      const app_script = `<script type="module" src="${app_asset.src}"></script>`;
      const props = JSON.stringify({ frontend: init.name, ...client });
      const hydrated = await inline(props, MIME.APPLICATION_JSON, "hydration");
      const script_src = [hydrated.integrity];

      return {
        body,
        head: head.concat(app_script, hydrated.head),
        headers: app.headers({ "script-src": script_src }),
      };
    }

    function respond(view: string, props: Dict = {}, options: ViewOptions = {}): ResponseFunction {
      return async (app, { as_layout, layouts = [] } = {}, request) => {
        if (as_layout) return load(view, props, app);
        const views = (await Promise.all((layouts as Layout[])
          .map(layout => layout(app, { as_layout: true }, request))))
          // set the actual page as the last view
          .concat(load(view, props, app));

        const $request = request.toJSON();
        const $props = init.layouts
          ? {
            views: await fn.async.map(views, ({ name }) => normalize(name)),
            props: views.map(c => c.props),
            request: $request,
          }
          : { props, request: $request };
        const client: ClientData = {
          view: init.layouts ? "root" : await normalize(view),
          spa: spa,
          ssr: ssr(),
          mode: app.mode,
          ...$props,
        };

        if (spa && request.headers.try("Accept") === MIME.APPLICATION_JSON) {
          const json_body = JSON.stringify(client);
          return new Response(json_body, {
            headers: {
              ...app.headers(),
              "Content-Type": MIME.APPLICATION_JSON,
              "Content-Length": String(app.body_length(json_body)),
              "Cache-Control": "no-store",
            },
            status: options.status ?? Status.OK,
          });
        }
        if (!ssr()) {
          const { head } = await render({ view: null as any, props: {} },
            client,
            app);
          return app.view({ body: "<div id=\"app\"></div>", head, ...options });
        }
        try {
          const server = init.layouts
            ? {
              view: app.loadView<S>(rootname),
              props: {
                views: views.map(c => c.view),
                props: views.map(c => c.props),
                request: $request,
              },
            }
            : {
              view: app.loadView<S>(view),
              props,
              request: $request,
            };

          const base = await render(server, client, app);

          const {
            body,
            head = base.head,
            headers = base.headers,
            partial = options.partial,
          } =
            await init.transform?.({ ...base, app, options, request })
            ?? { ...base, partial: undefined };

          return app.view({ body, head, headers, partial, ...options });
        } catch (error) {
          throw E.view_error(`${location.views}/${view}`, error as Error);
        }
      };
    };

    return {
      name: module_name,

      setup({ onInit, onBuild, onServe }) {
        onInit(async app => {
          await init.onInit?.(app, options as Options<E>);
          mode = app.mode;
        });

        onBuild(async app => {
          await init.onBuild?.(app, options as Options<E>);

          const build_ssr = options.ssr &&
            (app.mode !== "development" || !init.client);
          const compile_server = init.compile?.server;
          const compile_client = init.compile?.client;

          // prebuild
          extensions.forEach(e => {
            app.bind(e, async (file, { context }) => {
              if (context === "views" && !build_ssr) return "";
              // production: just compile to JS, don't bundle yet
              if (compile_server !== undefined) {
                return await compile_server(await file.text(), file);
              }

              return await file.text();
            });
          });

          // build
          if (init.root !== undefined && compile_server !== undefined) {
            const source = await compile_server(
              init.root.create(app.depth(), app.i18n_active),
              fs.ref(`root:${module_name}`));
            app.addRoot(rootname, source);
          }

          // publsh
          if (app.mode === "development") {
            app.frontends.set(module_name, [...extensions]);
          }

          if (compile_client !== undefined) {
            if (init.client) {
              app.frontends.set(module_name, [...extensions]);
              conditions.forEach(c => app.conditions.add(c));
            }

            app.plugin("client", {
              name: module_name,
              setup(build) {
                const resolveDir = app.root.path;
                const css_cache = new Map<string, string>();

                if (init.root !== undefined) {
                  const root = init.root;
                  const filter = new RegExp(`^${module_name}:root`);

                  build.onResolve({ filter }, ({ path }) => {
                    return { namespace: `${module_name}`, path };
                  });
                  build.onLoad({ filter }, async () => {
                    const contents = (await compile_client(root.create(
                      app.depth(), app.i18n_active),
                      fs.ref("/tmp"), true)).js;
                    return contents.length > 0 ? {
                      contents,
                      loader: "js",
                      resolveDir,
                    } : null;
                  });
                }

                if (init.css !== undefined) {
                  build.onResolve({ filter: new RegExp(`^${module_name}:css:`) }, args => {
                    return { path: args.path, namespace: `${module_name}-css` };
                  });
                  build.onLoad({ filter: /.*/, namespace: `${module_name}-css` }, args => {
                    const contents = css_cache.get(args.path);
                    return contents ? { contents, loader: "css" } : null;
                  });
                }

                const views_filter = new RegExp(`^${module_name}:views`);
                const views_base = app.root.join(location.views);

                build.onResolve({ filter: views_filter }, ({ path }) => {
                  return { namespace: `${module_name}`, path };
                });
                build.onLoad({ filter: views_filter }, async () => {
                  const views = await views_base.files({
                    recursive: true,
                    filter: c => extensions.includes(c.fullExtension),
                  });
                  let contents = "";
                  for (const view of views) {
                    const { path } = view.debase(views_base, "/");

                    contents += `export { default as ${await normalize(path)} }
                from "view:${path}";\n`;
                  }
                  return { contents, resolveDir: app.root.path };
                });

                const filter = new RegExp(`(${extensions.map(e =>
                  e.replace(".", "\\.")).join("|")})$`);

                build.onLoad({ filter }, async args => {
                  const file = fs.ref(args.path);
                  // compile file to JavaScript and potentially CSS
                  const compiled = await compile_client(await file.text(), file
                    , false);
                  let contents = compiled.js;

                  if (init.css !== undefined
                    && compiled.css !== null
                    && compiled.css !== undefined
                    && compiled.css !== "") {
                    const css_path = `${module_name}:css:${args.path}`;
                    css_cache.set(css_path, compiled.css);
                    contents += `\nimport "${css_path}";`;
                  }

                  return { contents };
                });
              },
            });
          }
        });

        onServe(async app => {
          await init.onServe?.(app, options as Options<E>);

          extensions.forEach(extension => app.frontend(extension, respond));
        });
      },
    };
  };
}

