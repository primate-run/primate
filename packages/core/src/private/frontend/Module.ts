import type App from "#App";
import type BuildApp from "#build/App";
import type ClientData from "#client/Data";
import fail from "#fail";
import type Render from "#frontend/Render";
import type ServerData from "#frontend/ServerData";
import type ServerView from "#frontend/ServerView";
import type View from "#frontend/View";
import type ViewResponse from "#frontend/ViewResponse";
import inline from "#inline";
import location from "#location";
import type Mode from "#Mode";
import Module from "#Module";
import type Next from "#module/Next";
import type NextBuild from "#module/NextBuild";
import type NextServe from "#module/NextServe";
import type RequestFacade from "#request/RequestFacade";
import type ServeApp from "#serve/App";
import hash from "@rcompat/crypto/hash";
import fn from "@rcompat/fn";
import type { FileRef } from "@rcompat/fs";
import fs from "@rcompat/fs";
import MIME from "@rcompat/http/mime";
import Status from "@rcompat/http/Status";
import type { Dict, MaybePromise } from "@rcompat/type";
import p from "pema";

type Layout = (app: ServeApp, transfer: Dict, request: RequestFacade)
  => View;

async function normalize(path: string, frontend: string) {
  const file = fs.ref(path);
  const basename = path.slice(0, -file.fullExtension.length);
  return `p_${await hash(`${basename}.${frontend}`)}`;
}

export default abstract class FrontendModule<
  S = ServerView,
> extends Module {
  // Whether this frontend supports client code (CSR)
  abstract client: boolean;
  // Whether this frontend supports recursive layouts
  abstract layouts: boolean;
  abstract defaultExtensions: string[];
  #options: typeof FrontendModule.options;
  render: Render<S> = async (view, props) =>
    ({ body: await (view as ServerView)(props) });
  root?: {
    create: (depth: number, i18n_active: boolean) => string;
  };
  compile: {
    client?: (text: string, file: FileRef, root: boolean) =>
      MaybePromise<{ css?: null | string; js: string }>;
    server?: (text: string, file?: FileRef) => MaybePromise<string>;
  } = {};
  css?: {
    filter: RegExp;
  };
  conditions: string[] = [];
  #mode: Mode = "development";

  static schema = p({
    fileExtensions: p.array(p.string).optional(),
    spa: p.boolean.default(true),
    ssr: p.boolean.default(true),
  });
  static options = FrontendModule.schema.infer;
  static input = FrontendModule.schema.input;

  constructor(options?: typeof FrontendModule.schema.input) {
    super();

    this.#options = FrontendModule.schema.parse(options);
  }

  get fileExtensions() {
    return this.#options.fileExtensions ?? this.defaultExtensions;
  }

  get package() {
    return `@primate/${this.name}`;
  }

  get rootname() {
    return `root_${this.name}`;
  }

  get ssr() {
    return this.#options.ssr && (this.#mode !== "development" || !this.client);
  }

  get spa() {
    return this.#options.spa;
  }

  #load(name: string, props: Dict, app: ServeApp) {
    if (!this.ssr) return { view: null, name, props };
    const view = app.loadView(name)!;
    return { view, name, props };
  };

  async #render(server: ServerData<S>, client: ClientData, app: ServeApp) {
    const { body, head = "", headers = {} } = this.ssr
      ? await this.render(server.view, server.props)
      : { body: "", head: "" };

    if (!this.client) {
      return { body, head, headers };
    }

    const app_asset = app.assets.find(asset =>
      asset.src?.includes("app") && asset.src.endsWith(".js"),
    );

    if (!app_asset) throw fail("Could not find app.js in assets");

    const app_script = `<script type="module" src="${app_asset.src}"></script>`;
    const props = JSON.stringify({ frontend: this.name, ...client });
    const hydrated = await inline(props, MIME.APPLICATION_JSON, "hydration");
    const script_src = [hydrated.integrity];

    return {
      body,
      head: head.concat(app_script, hydrated.head),
      headers: app.headers({ "script-src": script_src }),
    };
  }

  normalize(name: string) {
    return normalize(name, this.name);
  }

  respond: ViewResponse = (view, props = {}, options = {}) =>
    async (app, { as_layout, layouts = [] } = {}, request) => {
      if (as_layout) {
        return this.#load(view, props, app);
      }
      const views = (await Promise.all((layouts as Layout[])
        .map(layout => layout(app, { as_layout: true }, request))))
        /* set the actual page as the last view */
        .concat(this.#load(view, props, app));

      const $request = {
        context: request.context,
        cookies: request.cookies.toJSON(),
        headers: request.headers.toJSON(),
        path: request.path.toJSON(),
        query: request.query.toJSON(),
        url: request.url,
      };
      const $props = this.layouts
        ? {
          views: await fn.async.map(views, ({ name }) => this.normalize(name)),
          props: views.map(c => c.props),
          request: $request,
        }
        : { props, request: $request };
      const client: ClientData = {
        view: this.layouts ? "root" : await this.normalize(view),
        spa: this.spa,
        ssr: this.ssr,
        mode: app.mode,
        ...$props,
      };

      if (this.spa && request.headers.get("Accept") === MIME.APPLICATION_JSON) {
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
      if (!this.ssr) {
        const { head } = await this.#render({ view: null as any, props: {} },
          client,
          app);
        return app.view({ body: "<div id=\"app\"></div>", head, ...options });
      }
      try {
        const server = this.layouts
          ? {
            view: app.loadView<S>(this.rootname),
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

        const { body, head, headers } = await this.#render(server, client, app);

        return app.view({ body, head, headers, ...options });
      } catch (error) {
        const path = `${location.views}/${view}`;
        throw fail("error in view {0}\n{1}", path, error);
      }
    };

  serve(app: ServeApp, next: NextServe) {
    this.fileExtensions.forEach(fe => app.register(fe, this.respond));

    return next(app);
  }

  publish(app: BuildApp) {
    if (this.compile.client) {
      const { compile, css, fileExtensions, name, root, conditions } = this;
      const _normalize = this.normalize.bind(this);

      if (this.client) {
        app.frontends.set(name, [...fileExtensions]);
        conditions.forEach(condition => app.conditions.add(condition));
      }

      app.plugin("client", {
        name,
        setup(build) {
          const resolveDir = app.root.path;
          const css_cache = new Map<string, string>();

          if (root !== undefined) {
            const filter = new RegExp(`^${name}:root`);

            build.onResolve({ filter }, ({ path }) => {
              return { namespace: `${name}`, path };
            });
            build.onLoad({ filter }, async () => {
              const contents = (await compile.client!(root.create(app.depth(), app.i18n_active),
                fs.ref("/tmp"), true)).js;
              return contents ? { contents, loader: "js", resolveDir } : null;
            });
          }

          if (css !== undefined) {
            build.onResolve({ filter: new RegExp(`^${name}:css:`) }, args => {
              return { path: args.path, namespace: `${name}-css` };
            });
            build.onLoad({ filter: /.*/, namespace: `${name}-css` }, args => {
              const contents = css_cache.get(args.path);
              return contents ? { contents, loader: "css" } : null;
            });
          }

          const views_filter = new RegExp(`^${name}:views`);
          const views_base = app.root.join(location.views);

          build.onResolve({ filter: views_filter }, ({ path }) => {
            return { namespace: `${name}`, path };
          });
          build.onLoad({ filter: views_filter }, async () => {
            const views = await views_base.files({
              recursive: true,
              filter: c => fileExtensions.includes(c.fullExtension),
            });
            let contents = "";
            for (const view of views) {
              const { path } = view.debase(views_base, "/");

              contents += `export { default as ${await _normalize(path)} }
                from "#view/${path}";\n`;
            }
            return { contents, resolveDir: app.root.path };
          });

          const filter = new RegExp(`(${fileExtensions.map(e =>
            e.replace(".", "\\.")).join("|")})$`);

          build.onLoad({ filter }, async args => {
            const file = fs.ref(args.path);
            // compile file to JavaScript and potentially CSS
            const compiled = await compile.client!(await file.text(), file
              , false);
            let contents = compiled.js;

            if (css
              && compiled.css !== null
              && compiled.css !== undefined
              && compiled.css !== "") {
              const css_path = `${name}:css:${args.path}`;
              css_cache.set(css_path, compiled.css);
              contents += `\nimport "${css_path}";`;
            }

            return { contents };
          });
        },
      });
    }
  }

  init<T extends App>(app: T, next: Next<T>) {
    this.#mode = app.mode;

    return next(app);
  }

  prebuild(app: BuildApp) {
    this.fileExtensions.forEach(e => {
      app.bind(e, async (file, { context }) => {
        if (context === "views" && !this.ssr) return "";

        // production: just compile to JS, don't bundle yet
        if (this.compile.server) {
          return await this.compile.server(await file.text(), file);
        }

        return await file.text();
      });
    });
  }

  async build(app: BuildApp, next: NextBuild) {
    this.prebuild(app);

    // compile root server
    if (this.root !== undefined && this.compile.server !== undefined) {
      const source = await this.compile.server(
        this.root.create(app.depth(), app.i18n_active));
      app.addRoot(this.rootname, source);
    }

    this.publish(app);

    return next(app);
  };
}
