import type App from "#App";
import type BuildApp from "#BuildApp";
import type ClientData from "#client/Data";
import fail from "#fail";
import bundle from "#frontend/bundle-server";
import type Render from "#frontend/Render";
import type ServerData from "#frontend/ServerData";
import type ServerView from "#frontend/ServerView";
import type View from "#frontend/View";
import type ViewResponse from "#frontend/ViewResponse";
import inline from "#inline";
import location from "#location";
import Module from "#Module";
import type Next from "#module/Next";
import type NextBuild from "#module/NextBuild";
import type NextServe from "#module/NextServe";
import type RequestFacade from "#request/RequestFacade";
import type ServeApp from "#ServeApp";
import map from "@rcompat/async/map";
import hash from "@rcompat/crypto/hash";
import FileRef from "@rcompat/fs/FileRef";
import APPLICATION_JSON from "@rcompat/http/mime/application/json";
import Status from "@rcompat/http/Status";
import type Dict from "@rcompat/type/Dict";
import type MaybePromise from "@rcompat/type/MaybePromise";
import pema from "pema";
import array from "pema/array";
import boolean from "pema/boolean";
import string from "pema/string";

type Layout = (app: ServeApp, transfer: Dict, request: RequestFacade)
  => View;

async function normalize(path: string, frontend: string) {
  const file = new FileRef(path);
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
    server?: (text: string) => MaybePromise<string>;
  } = {};
  css?: {
    filter: RegExp;
  };

  static schema = pema({
    fileExtensions: array(string).optional(),
    spa: boolean.default(true),
    ssr: boolean.default(true),
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
    return this.#options.ssr;
  }

  get spa() {
    return this.#options.spa;
  }

  #load(name: string, props: Dict, app: ServeApp) {
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

    const app_script = `<script type="module" src="${app_asset.src}" integrity="${app_asset.integrity}"></script>`;
    const json_props = JSON.stringify({ frontend: this.name, ...client });
    const hydrated = await inline(json_props, APPLICATION_JSON, "hydration");
    const script_src = [hydrated.integrity, `'${app_asset.integrity}'`];

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
          views: await map(views, ({ name }) => this.normalize(name)),
          props: views.map(c => c.props),
          request: $request,
        }
        : { props, request: $request };
      const client: ClientData = {
        view: this.layouts ? "root" : await this.normalize(view),
        spa: this.spa,
        ssr: this.ssr,
        ...$props,
      };

      if (this.spa && request.headers.get("Accept") === APPLICATION_JSON) {
        const json_body = JSON.stringify(client);
        return new Response(json_body, {
          headers: {
            ...app.headers(),
            "Content-Type": APPLICATION_JSON,
            "Content-Length": String(app.body_length(json_body)),
            "Cache-Control": "no-store",
          },
          status: options.status ?? Status.OK,
        });
      }

      try {
        const server = this.layouts
          ? {
            view: app.loadView<S>(`${this.rootname}.js`),
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
        throw fail("error in view{0}\n{1}", path, error);
      }
    };

  serve(app: ServeApp, next: NextServe) {
    this.fileExtensions.forEach(fe => app.register(fe, this.respond));

    return next(app);
  }

  publish(app: BuildApp) {
    if (this.compile.client) {
      const { compile, css, fileExtensions, name, root } = this;
      const _normalize = this.normalize.bind(this);

      if (this.client) {
        fileExtensions.forEach(fe => app.frontends.set(name, fe));
      }

      app.build.plugin({
        name,
        setup(build) {
          const resolveDir = app.root.path;

          if (root !== undefined) {
            const filter = new RegExp(`^${name}:root`);

            build.onResolve({ filter }, ({ path }) => {
              return { namespace: `${name}`, path };
            });
            build.onLoad({ filter }, async () => {
              const contents = (await compile.client!(root.create(app.depth(), app.i18n_active),
                new FileRef("/tmp"), true)).js;
              return contents ? { contents, loader: "js", resolveDir } : null;
            });
          }

          if (css !== undefined) {
            build.onResolve({ filter: css.filter }, ({ path }) => {
              return { namespace: `${name}css`, path };
            });
            build.onLoad({ filter: css.filter }, ({ path }) => {
              const contents = app.build.load(FileRef.webpath(path));
              return contents
                ? { contents, loader: "css", resolveDir: resolveDir }
                : null;
            });
          }

          const views_filter = new RegExp(`^${name}:views`);
          const views_base = app.root.join(location.views);

          build.onResolve({ filter: views_filter }, ({ path }) => {
            return { namespace: `${name}`, path };
          });
          build.onLoad({ filter: views_filter }, async () => {
            const views = await views_base
              .collect(c => fileExtensions.includes(c.fullExtension));
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
            const file = new FileRef(args.path);
            // Compile file to JavaScript and potentially CSS
            const compiled = await compile.client!(await file.text(), file
              , false);
            let contents = compiled.js;

            if (css
              && compiled.css !== null
              && compiled.css !== undefined
              && compiled.css !== "") {
              const path = FileRef.webpath(`${args.path}css`);
              app.build.save(path, compiled.css);
              contents += `\nimport "${path}";`;
            }

            return { contents };
          });
        },
      });
    }
  }

  #create_wrapper(view: string) {
    return `export default "${view}";`;
  }

  init<T extends App>(app: T, next: Next<T>) {
    this.fileExtensions.forEach(e => {
      app.bind(e, async (file, { context }) => {
        if (this.compile.server) {
          const code = await this.compile.server(await file.text());
          const bundled = await bundle({
            code,
            source: file,
            root: app.root,
            extensions: this.fileExtensions,
            compile: async s => this.compile.server!(s),
          });

          if (context === "views") {
            const relative = file.debase(app.root.join(location.views));
            const basename = relative.path.slice(1, -relative.fullExtension.length);

            const internal = app.runpath(location.views, `${basename}.internal.js`);
            await internal.directory.create({ recursive: true });
            await internal.write(bundled);

            return this.#create_wrapper(relative.path.slice(1));
          }

          return bundled;
        }
        return await file.text();
      });
    });
    return next(app);
  }

  async build(app: BuildApp, next: NextBuild) {
    // compile root server
    if (this.root !== undefined && this.compile.server !== undefined) {
      const filename = `${this.rootname}.js`;
      const root = await this.compile.server(this.root.create(app.depth(), app.i18n_active));
      const path = app.runpath(location.server, filename);
      await path.write(root);
      app.addRoot(path);
    }

    this.publish(app);

    return next(app);
  };
}
