import type App from "#App";
import AppError from "#AppError";
import type BuildApp from "#BuildApp";
import type ClientData from "#frontend/ClientData";
import type Component from "#frontend/Component";
import type Frontend from "#frontend/Frontend";
import type Render from "#frontend/Render";
import type ServerComponent from "#frontend/ServerComponent";
import type ServerData from "#frontend/ServerData";
import inline from "#inline";
import location from "#location";
import Module from "#Module";
import type Next from "#module/Next";
import type NextBuild from "#module/NextBuild";
import type NextServe from "#module/NextServe";
import type RequestFacade from "#RequestFacade";
import type ServeApp from "#ServeApp";
import assert from "@rcompat/assert";
import map from "@rcompat/async/map";
import hash from "@rcompat/crypto/hash";
import FileRef from "@rcompat/fs/FileRef";
import { json } from "@rcompat/http/mime";
import Status from "@rcompat/http/Status";
import type Dict from "@rcompat/type/Dict";
import type MaybePromise from "@rcompat/type/MaybePromise";
import pema from "pema";
import boolean from "pema/boolean";
import string from "pema/string";

type Layout = (app: ServeApp, transfer: Dict, request: RequestFacade)
  => Component;

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
  abstract defaultExtension: string;
  #options: typeof FrontendModule.options;
  render: Render<S> = async (component, props) =>
    ({ body: await (component as ServerComponent)(props) });
  root?: {
    create: (depth: number) => string;
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
    extension: string.optional(),
    spa: boolean.default(true),
    ssr: boolean.default(true),
  });

  static options = FrontendModule.schema.infer;
  static input = FrontendModule.schema.input;

  constructor(options?: typeof FrontendModule.schema.input) {
    super();

    this.#options = FrontendModule.schema.validate(options);
  }

  get extension() {
    return this.#options.extension ?? this.defaultExtension;
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
    const hydrated = await inline(json_props, "application/json", "hydration");
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

  handler: Frontend = (component, props = {}, options = {}) =>
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
        cookies: request.cookies,
        headers: request.headers,
        path: request.path,
        query: request.query,
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

      if (this.spa && request.headers.accept === json) {
        return new Response(JSON.stringify(client), {
          headers: { ...app.headers(), "Content-Type": json },
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
    app.register(this.extension, this.handler);

    return next(app);
  }

  publish(app: BuildApp) {
    if (this.compile.client) {
      const { compile, css, extension, name, root } = this;

      if (this.client) {
        app.frontends.set(name, extension);
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
              const contents = (await compile.client!(root.create(app.depth()),
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

          build.onResolve({ filter: components_filter }, ({ path }) => {
            return { namespace: `${name}`, path };
          });
          build.onLoad({ filter: components_filter }, async () => {
            const components = await app.root
              .join(location.components)
              .collect(e => e.fullExtension === extension);
            let contents = "";
            for (const component of components) {
              const { path } = component.debase(component.directory, "/");
              contents += `export { default as ${await normalize(path)} }
                from "#component/${path}";\n`;
            }
            return { contents, resolveDir: app.root.path };
          });

          build.onLoad({ filter: new RegExp(`${extension}$`) }, async args => {
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
    app.bind(this.extension, async (file, { context }) => {
      assert(context === "components",
        `${this.name}: only components supported`);

      if (this.compile.server) {
        // compile server component
        const code = await this.compile.server(await file.text());
        await file.append(".js")
          .write(code.replaceAll(this.extension, `${this.extension}.js`));
      }
    });
    return next(app);
  }

  async build(app: BuildApp, next: NextBuild) {
    // compile root server
    if (this.root !== undefined && this.compile.server !== undefined) {
      const filename = `${this.rootname}.js`;
      const root = await this.compile.server(this.root.create(app.depth()));
      const path = app.runpath(location.server, filename);
      await path.write(root);
      app.addRoot(path);
    }

    this.publish(app);

    return next(app);
  };
}
