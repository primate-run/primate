import App from "#App";
import AppError from "#AppError";
import type Asset from "#asset/Asset";
import type Font from "#asset/Font";
import type Script from "#asset/Script";
import type Style from "#asset/Style";
import type Body from "#Body";
import DevModule from "#builtin/DevModule";
import HandleModule from "#builtin/HandleModule";
import SessionModule from "#builtin/SessionModule";
import type CSP from "#CSP";
import type Frontend from "#frontend/Frontend";
import type FrontendOptions from "#frontend/Options";
import type ServerComponent from "#frontend/ServerComponent";
import hash from "#hash";
import parse from "#hook/parse";
import type Loader from "#Loader";
import location from "#location";
import log from "#log";
import reducer from "#reducer";
import type RequestFacade from "#RequestFacade";
import router from "#router";
import type ServeInit from "#ServeInit";
import tags from "#tags";
import type Verb from "#Verb";
import is from "@rcompat/assert/is";
import FileRef from "@rcompat/fs/FileRef";
import FileRouter from "@rcompat/fs/FileRouter";
import type Actions from "@rcompat/http/Actions";
import BodyParser from "@rcompat/http/body";
import type Conf from "@rcompat/http/Conf";
import { html } from "@rcompat/http/mime";
import serve from "@rcompat/http/serve";
import type Server from "@rcompat/http/Server";
import Status from "@rcompat/http/Status";
import entries from "@rcompat/record/entries";
import type Dict from "@rcompat/type/Dict";
import type PartialDict from "@rcompat/type/PartialDict";
import pema from "pema";
import record from "pema/record";
import string from "pema/string";
import uint from "pema/uint";

interface ViewOptions extends FrontendOptions {
  body: string;
}

type Entry<T> = [keyof T, Required<T>[keyof T]];

const deroot = (pathname: string) => pathname.endsWith("/") && pathname !== "/"
  ? pathname.slice(0, -1)
  : pathname;
// remove excess slashes
const deslash = (url: string) => url.replaceAll(/\/{2,}/gu, _ => "/");

const normalize = (pathname: string) => deroot(deslash(pathname));

const parse_body = async (request: Request, url: URL): Promise<Body> => {
  try {
    return await BodyParser.parse(request) as Body;
  } catch (error) {
    throw new AppError("{0}: error in request body: {1}", url.pathname, error);
  }
};

const to_csp = (config_csp: Entry<CSP>[], assets: CSP, override: CSP) => config_csp
  // only csp entries in the config will be enriched
  .map<Entry<CSP>>(([key, directives]) =>
    // enrich with application assets
    [key, assets[key] ? directives.concat(...assets[key]) : directives],
  )
  .map<Entry<CSP>>(([key, directives]) =>
    // enrich with explicit csp
    [key, override[key] ? directives.concat(...override[key]) : directives],
  )
  .map(([key, directives]) => `${key} ${directives.join(" ")}`)
  .join(";");

const render_head = (assets: Asset[], fonts: unknown[], head?: string) =>
  assets.toSorted(({ type }) => -1 * Number(type === "importmap"))
    .map(({ code, inline, integrity, src, type }) =>
      type === "style"
        ? tags.style({ code, href: src, inline } as Style)
        : tags.script({ code, inline, integrity, src, type } as Script),
    ).join("\n").concat("\n", head ?? "").concat("\n", fonts.map(href =>
      tags.font({ href, type: "font/woff2" } as Font),
    ).join("\n"));

const s_http = Symbol("s_http");

interface PublishOptions {
  code: string;
  inline: boolean;
  src?: string;
  type: string;
};

type Import = {
  default: unknown;
} & Dict;

export default class ServeApp extends App {
  #init: ServeInit;
  #server?: Server;
  #components: PartialDict<Import>;
  #csp: CSP = {};
  #fonts: unknown[] = [];
  #assets: Asset[] = [];
  #frontends: PartialDict<Frontend> = {};
  #router: FileRouter;
  #builtins: {
    dev?: DevModule;
    handle: HandleModule;
    session: SessionModule;
  };

  constructor(rootfile: string, init: ServeInit) {
    super(new FileRef(rootfile).directory, init.config, init.mode);

    this.#init = init;
    this.#components = Object.fromEntries(init.components ?? []);

    const http = this.#init.config.http;

    this.set(s_http, {
      host: http.host,
      port: http.port,
      ssl: this.secure ? {
        cert: this.root.join(http.ssl.cert!),
        key: this.root.join(http.ssl.key!),
      } : {},
    });

    this.#router = FileRouter.init({
      extensions: [".js"],
      specials: {
        error: { recursive: true },
        guard: { recursive: true },
        layout: { recursive: true },
      },
    }, init.files.routes.map(s => s[0]));

    this.#builtins = {
      dev: init.mode === "development" ? new DevModule(this) : undefined,
      handle: new HandleModule(this),
      session: new SessionModule(this),
    };
  };

  get secure() {
    const ssl = this.config("http.ssl");

    return ssl.key !== undefined && ssl.cert !== undefined;
  }

  loader<T extends Loader>() {
    return this.#init.loader as T;
  }

  serve(pathname: string) {
    return this.loader().serve(pathname);
  }

  get assets() {
    return this.#assets;
  }

  get url() {
    const { host, port } = this.config("http");
    return `http${this.secure ? "s" : ""}://${host}:${port}`;
  };

  get router() {
    return this.#router;
  }

  get frontends() {
    return { ...this.#frontends };
  }

  get files() {
    return this.#init.files;
  }

  component<T = ServerComponent>(name: string) {
    const base = name.slice(0, name.lastIndexOf((".")));
    const component = this.#components[base];
    if (component === undefined) {
      const path = `${location.components}/${name}`;
      throw new AppError("missing component {0}", path);
    }
    return (component!.default ?? component) as T;
  };

  headers(csp = {}) {
    const http_csp = Object.entries(this.config("http.csp") ?? {}) as Entry<CSP>[];

    return {
      ...this.config("http.headers") ?? {},
      ...http_csp.length === 0 ? {} : {
        "Content-Security-Policy": to_csp(
          http_csp,
          this.#csp,
          csp),
      },
    };
  };

  render(content: Omit<ViewOptions, keyof ResponseInit>) {
    const { body, head, page, partial, placeholders = {} } = content;
    ["body", "head"].forEach(key => is(placeholders[key]).undefined());

    return partial ? body : Object.entries(placeholders)
      // replace given placeholders, defaulting to ""
      .reduce((rendered, [key, value]) => rendered
        .replaceAll(`%${key}%`, value?.toString() ?? ""), this.page(page))
      // replace non-given placeholders, aside from %body% / %head%
      .replaceAll(/(?<keep>%(?:head|body)%)|%.*?%/gus, "$1")
      // replace body and head
      .replace("%body%", body)
      .replace("%head%", render_head(this.#assets, this.#fonts, head));
  }

  page(page?: string) {
    return this.loader().page(page);
  }

  respond(body: BodyInit | null, init?: ResponseInit) {
    const { headers, status } = pema({
      headers: record(string, string),
      status: uint.values(Status).default(Status.OK),
    }).validate(init);

    return new Response(body, {
      headers: {
        "Content-Type": html, ...this.headers(), ...headers,
      }, status: status as number,
    });
  };

  view(options: ViewOptions) {
    // split render and respond options
    const { headers = {}, status = Status.OK, statusText, ...rest } = options;
    return this.respond(this.render(rest), { headers, status });
  };

  media(content_type: string, response: ResponseInit = {}): ResponseInit {
    return {
      headers: { ...response.headers, "Content-Type": content_type },
      status: response.status ?? Status.OK,
    };
  };

  async publish({ code, inline = false, src, type = "" }: PublishOptions) {
    if (inline || type === "style") {
      this.#assets.push({
        code: inline ? code : "",
        inline,
        integrity: await hash(code),
        src: FileRef.join(this.#init.config.http.static.root, src ?? "").path,
        type,
      });
    }

    // rehash assets_csp
    this.create_csp();
  };

  create_csp() {
    this.#csp = this.#assets.map(({ integrity, type: directive }) =>
      [`${directive === "style" ? "style" : "script"}-src`, integrity])
      .reduce((csp: CSP, [directive, hash]) =>
        ({ ...csp, [directive]: csp[directive as keyof CSP]!.concat(`'${hash}'`) }),
        { "script-src": [], "style-src": [] },
      );
  };

  register(extension: string, frontend: Frontend) {
    if (this.#frontends[extension] !== undefined) {
      throw new AppError("double file extension {0}", extension);
    }
    this.#frontends[extension] = frontend;
  };

  async start() {
    this.#assets = await Promise.all(this.#init.assets.map(async asset => {
      const code = asset.type === "importmap"
        ? JSON.stringify(asset.code as Dict, null, 2)
        : asset.code as string;
      return {
        ...asset,
        code,
        integrity: await hash(code),
      };
    }));
    const modules = [this.#builtins.dev, this.#builtins.session,
    ...this.modules, this.#builtins.handle].filter(m => m !== undefined);

    const handle = (request: RequestFacade) =>
      reducer(modules, request, "handle") as Promise<Response>;

    this.#server = await serve(async request => {
      try {
        return await handle(parse(request));
      } catch (error) {
        log.error(error);
        return new Response(null, { status: Status.INTERNAL_SERVER_ERROR });
      }
    }, this.get<Conf>(s_http));
    log.system("started {0}", this.url);
  };

  stop() {
    this.#server!.stop();
    log.system("stopped {0}", this.url);
  };

  upgrade(request: Request, actions: Actions) {
    return this.#server!.upgrade(request, actions);
  }

  async route(facade: RequestFacade) {
    const { request, url } = facade;
    const $request_body_parse = this.config("request.body.parse");

    const pathname = normalize(url.pathname);
    const route = this.router.match(request);
    if (route === undefined) {
      log.info("no {0} route to {1}", request.method, pathname);
      return;
    }

    const verb = request.method.toLowerCase() as Verb;
    const local_parse_body = /*route.file.body?.parse ?? */$request_body_parse;
    const body = local_parse_body ? await parse_body(request, url) : null;
    const { errors = [], guards = [], layouts = [] } = entries(route.specials)
      .map(([key, value]) => [`${key}s`, value ?? []])
      .map(([key, value]) => [key, value.map(v => {
        const verbs = router.get(v);
        const handler = verbs[verb];
        if (handler === undefined) {
          throw new AppError("route {0} has no {1} verb", route.fullpath, verb);
        }
        return handler;
      })])
      .get();

    const verbs = router.get(route.fullpath)!;
    const handler = verbs[verb];

    if (handler === undefined) {
      throw new AppError("route {0} has no {1} verb", route.fullpath, verb);
    }

    return {
      errors,
      guards,
      handler,
      layouts,
      request: {
        ...facade,
        body,
        path: route.params as PartialDict<string>,
      },
    };
  }

  get session() {
    return this.#init.session_config;
  };
}
