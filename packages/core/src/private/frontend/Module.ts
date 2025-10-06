import type App from "#App";
import AppError from "#AppError";
import type BuildApp from "#BuildApp";
import type ClientData from "#client/Data";
import bundle from "#frontend/bundle-server";
import type Component from "#frontend/Component";
import type Render from "#frontend/Render";
import type ServerComponent from "#frontend/ServerComponent";
import type ServerData from "#frontend/ServerData";
import type ViewResponse from "#frontend/ViewResponse";
import inline from "#inline";
import location from "#location";
import Module from "#Module";
import type Next from "#module/Next";
import type NextBuild from "#module/NextBuild";
import type NextServe from "#module/NextServe";
import type RequestFacade from "#request/RequestFacade";
import type ServeApp from "#ServeApp";
import assert from "@rcompat/assert";
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
  => Component;

const contexts = ["lib", "components"];

async function normalize(path: string) {
  return `p_${await hash(path)}`;
}

export default abstract class FrontendModule<
  S = ServerComponent,
> extends Module {
  // Whether this frontend supports client code (CSR)
  abstract client: boolean;
  // Whether this frontend supports recursive layouts
  abstract layouts: boolean;
  abstract defaultExtensions: string[];
  #options: typeof FrontendModule.options;
  render: Render<S> = async (component, props) =>
    ({ body: await (component as ServerComponent)(props) });
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
    const component = app.component(name)!;
    return { component, name, props };
  };

  async #render(server: ServerData<S>, client: ClientData, app: ServeApp) {
    const { body, head = "", headers = {} } = this.ssr
      ? await this.render(server.component, server.props)
      : { body: "", head: "" };

    if (!this.client) {
      return { body, head, headers };
    }

    const code = "import app from \"app\"; app.start();";
    const inlined = await inline(code, "module");

    const json_props = JSON.stringify({ frontend: this.name, ...client });
    const hydrated = await inline(json_props, APPLICATION_JSON, "hydration");
    const script_src = [inlined.integrity, hydrated.integrity];

    return {
      body,
      head: head.concat(inlined.head, hydrated.head),
      headers: app.headers({ "script-src": script_src }),
    };
  }

  normalize(name: string) {
    return normalize(name);
  }

  respond: ViewResponse = (component, props = {}, options = {}) =>
    async (app, { as_layout, layouts = [] } = {}, request) => {
      if (as_layout) {
        return this.#load(component, props, app);
      }
      const components = (await Promise.all((layouts as Layout[])
        .map(layout => layout(app, { as_layout: true }, request))))
        /* set the actual page as the last component */
        .concat(this.#load(component, props, app));

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
          components: await map(components, ({ name }) => normalize(name)),
          props: components.map(c => c.props),
          request: $request,
        }
        : { props, request: $request };
      const client: ClientData = {
        component: this.layouts ? "root" : await normalize(component),
        spa: this.spa,
        ssr: this.ssr,
        ...$props,
      };

      if (this.spa && request.headers.get("Accept") === APPLICATION_JSON) {
        return new Response(JSON.stringify(client), {
          headers: { ...app.headers(), "Content-Type": APPLICATION_JSON },
          status: options.status ?? Status.OK,
        });
      }

      try {
        const server = this.layouts
          ? {
            component: app.component<S>(`${this.rootname}.js`),
            props: {
              components: components.map(c => c.component),
              props: components.map(c => c.props),
              request: $request,
            },
          }
          : {
            component: app.component<S>(component),
            props,
            request: $request,
          };

        const { body, head, headers } = await this.#render(server, client, app);

        return app.view({ body, head, headers, ...options });
      } catch (error) {
        const path = `${location.components}/${component}`;
        throw new AppError("error in component {0}\n{1}", path, error);
      }
    };

  serve(app: ServeApp, next: NextServe) {
    this.fileExtensions.forEach(fe => app.register(fe, this.respond));

    return next(app);
  }

  publish(app: BuildApp) {
    if (this.compile.client) {
      const { compile, css, fileExtensions, name, root } = this;

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

          const components_filter = new RegExp(`^${name}:components`);
          const components_base = app.root.join(location.components);

          build.onResolve({ filter: components_filter }, ({ path }) => {
            return { namespace: `${name}`, path };
          });
          build.onLoad({ filter: components_filter }, async () => {
            const components = await components_base
              .collect(c => fileExtensions.includes(c.fullExtension));
            let contents = "";
            for (const component of components) {
              const { path } = component.debase(components_base, "/");
              contents += `export { default as ${await normalize(path)} }
                from "#component/${path}";\n`;
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

  init<T extends App>(app: T, next: Next<T>) {
    this.fileExtensions.forEach(e => {
      app.bind(e, async (file, { context }) => {
        assert(contexts.includes(context), `${this.name}: only components or lib supported`);

        if (this.compile.server) {
          const original = file.debase(app.runpath("stage", context));
          const source = app.path[context].join(original);
          const code = await this.compile.server(await source.text());
          const bundled = await bundle({
            code,
            source,
            root: app.root,
            extensions: this.fileExtensions,
            compile: async s => this.compile.server!(s),
          });
          await file.append(".js").write(bundled);
        }
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
