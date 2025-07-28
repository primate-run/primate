import App from "#App";
import AppError from "#AppError";
import type Asset from "#asset/Asset";
import type Font from "#asset/Font";
import type Script from "#asset/Script";
import type Style from "#asset/Style";
import type Body from "#Body";
import type CSP from "#CSP";
import type Frontend from "#frontend/Frontend";
import type FrontendOptions from "#frontend/Options";
import type ServerComponent from "#frontend/ServerComponent";
import hash from "#hash";
import handle from "#hook/handle";
import parse from "#hook/parse";
import type Loader from "#Loader";
import location from "#location";
import log from "#log";
import type RequestFacade from "#RequestFacade";
import type RouteExport from "#RouteExport";
import type RouteSpecial from "#RouteSpecial";
import type ServeInit from "#ServeInit";
import tags from "#tags";
import type Verb from "#Verb";
import is from "@rcompat/assert/is";
import FileRef from "@rcompat/fs/FileRef";
import Router from "@rcompat/fs/router";
import type Actions from "@rcompat/http/Actions";
import BodyParser from "@rcompat/http/body";
import type Conf from "@rcompat/http/Conf";
import { html } from "@rcompat/http/mime";
import serve from "@rcompat/http/serve";
import type Server from "@rcompat/http/Server";
import Status from "@rcompat/http/Status";
import entries from "@rcompat/record/entries";
import stringify from "@rcompat/record/stringify";
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
    .map(({ src, code, type, inline, integrity }) =>
      type === "style"
        ? tags.style({ inline, code, href: src } as Style)
        : tags.script({ inline, code, type, integrity, src } as Script),
    ).join("\n").concat("\n", head ?? "").concat("\n", fonts.map(href =>
      tags.font({ href, type: "font/woff2" } as Font),
    ).join("\n"));

const s_http = Symbol("s_http");

interface PublishOptions {
  src?: string;
  code: string;
  type: string;
  inline: boolean;
};

type Import = Dict & {
  default: unknown;
};

export default class ServeApp extends App {
  #init: ServeInit;
  #server?: Server;
  #components: PartialDict<Import>;
  #csp: CSP = {};
  #fonts: unknown[] = [];
  #assets: Asset[] = [];
  #frontends: PartialDict<Frontend> = {};
  #router: ReturnType<typeof Router.init<RouteExport, RouteSpecial>>;

  constructor(rootfile: string, init: ServeInit) {
    super(new FileRef(rootfile).directory, init.config, init.mode);

    this.#init = init;
    this.#components = Object.fromEntries(init.components ?? []);

    const http = this.#init.config.http;

    this.set(s_http, {
      host: http.host,
      port: http.port,
      ssl: this.secure ? {
        key: this.root.join(http.ssl.key!),
        cert: this.root.join(http.ssl.cert!),
      } : {},
    });

    this.#router = Router.init<RouteExport, RouteSpecial>({
      import: true,
      extensions: [".js"],
      specials: {
        guard: { recursive: true },
        error: { recursive: false },
        layout: { recursive: true },
      },
      predicate(route, request) {
        return (route as { default: Dict })
          .default[request.method.toLowerCase()] !== undefined;
      },
    }, init.files.routes);
  }

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
    const { body, head, partial, placeholders = {}, page } = content;
    ["body", "head"].forEach(key => is(placeholders[key]).undefined());

    return partial ? body : Object.entries(placeholders)
      // replace given placeholders, defaulting to ""
      .reduce((html, [key, value]) => html.replace(`%${key}%`, value?.toString() ?? ""),
        this.page(page))
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
    const { status, headers } = pema({
      status: uint.values(Status).default(Status.OK),
      headers: record(string, string),
    }).validate(init);

    return new Response(body, {
      status: status as number, headers: {
        "Content-Type": html, ...this.headers(), ...headers,
      },
    });
  };

  view(options: ViewOptions) {
    // split render and respond options
    const { status = Status.OK, headers = {}, statusText, ...rest } = options;
    return this.respond(this.render(rest), { status, headers });
  };

  media(content_type: string, response: ResponseInit = {}): ResponseInit {
    return {
      status: response.status ?? Status.OK,
      headers: { ...response.headers, "Content-Type": content_type },
    };
  };

  async publish({ src, code, type = "", inline = false }: PublishOptions) {
    if (inline || type === "style") {
      this.#assets.push({
        src: FileRef.join(this.#init.config.http.static.root, src ?? "").path,
        code: inline ? code : "",
        type,
        inline,
        integrity: await hash(code),
      });
    }

    // rehash assets_csp
    this.create_csp();
  };

  create_csp() {
    this.#csp = this.#assets.map(({ type: directive, integrity }) =>
      [`${directive === "style" ? "style" : "script"}-src`, integrity])
      .reduce((csp: CSP, [directive, hash]) =>
        ({ ...csp, [directive]: csp[directive as keyof CSP]!.concat(`'${hash}'`) }),
        { "style-src": [], "script-src": [] },
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
        ? stringify(asset.code as Dict)
        : asset.code as string;
      return {
        ...asset,
        code,
        integrity: await hash(code),
      };
    }));
    const _handle = handle(this);
    this.#server = await serve(async request => {
      try {
        return await _handle(parse(request));
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

    const local_parse_body = route.file.body?.parse ?? $request_body_parse;
    const body = local_parse_body ? await parse_body(request, url) : null;
    const { guards = [], errors = [], layouts = [] } = entries(route.specials)
      .map(([key, value]) => [`${key}s`, value]).get();

    return {
      guards: guards as RouteSpecial[],
      errors: errors as RouteSpecial[],
      layouts: layouts as RouteSpecial[],
      handler: route.file.default[request.method.toLowerCase() as Verb],
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
