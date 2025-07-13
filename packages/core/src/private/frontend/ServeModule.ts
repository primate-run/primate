import component_error from "#error/component-error";
import type ClientOptions from "#frontend/ClientOptions";
import type Component from "#frontend/Component";
import type Frontend from "#frontend/Frontend";
import Module from "#frontend/Module";
import type Props from "#frontend/Props";
import type Render from "#frontend/Render";
import type ServerComponent from "#frontend/ServerComponent";
import type NextServe from "#module/NextServe";
import type RequestFacade from "#RequestFacade";
import type ServeApp from "#ServeApp";
import map from "@rcompat/async/map";
import { json } from "@rcompat/http/mime";
import Status from "@rcompat/http/Status";
import type Dictionary from "@rcompat/type/Dictionary";
import location from "#location";
import inline from "#inline";

type Layout = (app: ServeApp, transfer: Dictionary, request: RequestFacade)
=> Component;

export default abstract class ServeModule <
  S = ServerComponent,
> extends Module {
  abstract root: boolean;
  client?: (client: any, options: ClientOptions) => string;
  render: Render<S> = async (component, props) =>
    ({ body: await (component as ServerComponent)(props) });

  #load(name: string, props: Props, app: ServeApp) {
    const component = app.component(name)!;
    return { name, props, component };
  };

  async #render(server: S, props: Props, client: any, app: ServeApp) {
    const { body, head = "", headers = {} } = this.ssr
      ? await this.render(server, props)
      : { body: "", head: "" };

    if (this.client === undefined) {
      return { body, head, headers };
    }

    const options = { spa: this.spa, ssr: this.ssr };
    const code = this.client(client, options);
    const inlined = await inline(code, "module");
    const script_src = [inlined.integrity];

    return {
      body,
      head: head.concat(inlined.head),
      headers: app.headers({ "script-src": script_src }),
    };
  }

  handler: Frontend = (name, props = {}, options = {}) =>
    async (app, { layouts = [], as_layout } = {}, request) => {
      if (as_layout) {
        return this.#load(name, props, app);
      }
      const components = (await Promise.all((layouts as Layout[])
        .map(layout => layout(app, { as_layout: true }, request))))
        /* set the actual page as the last component */
        .concat(this.#load(name, props, app));
      const names = await map(components, ({ name }) => this.normalize(name));
      const shared = {
        data: components.map(component => component.props),
        request: {
          path: request.path,
          query: request.query,
          headers: request.headers,
          cookies: request.cookies,
          context: request.context,
          url: request.url,
        },
      };
      const client: any = (this.root
        ? { names, ...shared }
        : { component: await this.normalize(name), props }) as any;

      if (this.spa && request.headers.accept === json) {
        return new Response(JSON.stringify(client), {
          status: options.status ?? Status.OK,
          headers: { ...app.headers(), "Content-Type": json },
        });
      }

      try {
        const server = app.component<S>(this.root
          ? `${this.rootname}.js`
          : name);
        const $props = this.root
          ? {
            components: components.map(({ component }) => component),
            ...shared,
          }
          : props;

        const { body, head, headers } = await this.#render(server, $props, client, app);

        return app.view({ body, head, headers, ...options });
      } catch (error) {
        component_error(`${location.components}/${name}`, `${error}`);
      }
    };

  serve(app: ServeApp, next: NextServe) {
    app.register(this.extension, this.handler);

    return next(app);
  }
}
