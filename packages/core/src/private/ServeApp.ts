import App from "#App";
import type Asset from "#asset/Asset";
import type Font from "#asset/Font";
import type Script from "#asset/Script";
import type Style from "#asset/Style";
import DevModule from "#builtin/DevModule";
import HandleModule from "#builtin/HandleModule";
import type CSP from "#CSP";
import fail from "#fail";
import type ServerView from "#frontend/ServerView";
import type ViewOptions from "#frontend/ViewOptions";
import type ViewResponse from "#frontend/ViewResponse";
import hash from "#hash";
import type I18NConfig from "#i18n/Config";
import I18NModule from "#i18n/Module";
import type Loader from "#Loader";
import location from "#location";
import log from "#log";
import reducer from "#reducer";
import parse from "#request/parse";
import RequestBag from "#request/RequestBag";
import RequestBody from "#request/RequestBody";
import type RequestFacade from "#request/RequestFacade";
import type Verb from "#request/Verb";
import router from "#route/router";
import type ServeInit from "#ServeInit";
import SessionModule from "#session/SessionModule";
import tags from "#tags";
import is from "@rcompat/assert/is";
import FileRef from "@rcompat/fs/FileRef";
import FileRouter from "@rcompat/fs/FileRouter";
import type Actions from "@rcompat/http/Actions";
import type Conf from "@rcompat/http/Conf";
import TEXT_HTML from "@rcompat/http/mime/text/html";
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

interface FullViewOptions extends ViewOptions {
  body: string;
}

type Entry<T> = [keyof T, Required<T>[keyof T]];

const deroot = (pathname: string) => pathname.endsWith("/") && pathname !== "/"
  ? pathname.slice(0, -1)
  : pathname;
// remove excess slashes
const deslash = (url: string) => url.replaceAll(/\/{2,}/gu, _ => "/");

const normalize = (pathname: string) => deroot(deslash(pathname));

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

const render_head = (assets: Asset[], head?: string) => {
  const fonts = assets.filter(asset => asset.src?.endsWith(".woff2"));
  const rest = assets.filter(asset =>
    !asset.src?.endsWith(".woff2")
    && asset.type !== "js",
  );

  return fonts.map(font =>
    tags.font({ href: font.src, type: "font/woff2" } as Font),
  ).join("\n").concat("\n", rest.toSorted(({ type }) => -1 * Number(type === "importmap"))
    .map(({ code, inline, integrity, src, type }) =>
      type === "style"
        ? tags.style({ code, href: src, inline } as Style)
        : tags.script({ code, inline, integrity, src, type } as Script),
    ).join("\n")).concat("\n", head ?? "");
};

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
  #views: PartialDict<Import>;
  #csp: CSP = {};
  #assets: Asset[] = [];
  #stores: Dict;
  #frontends: PartialDict<ViewResponse> = {};
  #router: FileRouter;
  #builtins: {
    dev?: DevModule;
    handle: HandleModule;
    session: SessionModule;
    i18n?: I18NModule;
  };
  #i18n_config?: I18NConfig;
  constructor(rootfile: string, init: ServeInit) {
    super(new FileRef(rootfile).directory, init.config, init.mode);

    this.#init = init;
    this.#views = Object.fromEntries(init.views ?? []);
    this.#stores = Object.fromEntries((init.stores?.map(([k, s]) =>
      [k, s.default])) ?? []);

    const http = this.#init.config.http;
    this.#i18n_config = init.i18n_config;

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
        error: { recursive: false },
        guard: { recursive: true },
        layout: { recursive: true },
      },
    }, init.files.routes.map(s => s[0]));

    this.#builtins = {
      dev: init.mode === "development" ? new DevModule(this) : undefined,
      handle: new HandleModule(this),
      session: new SessionModule(this),
      i18n: init.i18n_config ? new I18NModule(init.i18n_config) : undefined,
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

  get modules() {
    const { session, i18n } = this.#builtins;
    return [session, i18n, ...super.modules].filter(m => m !== undefined);
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

  get stores() {
    return this.#stores;
  }

  get i18n() {
    return this.#i18n_config;
  }

  loadView<T = ServerView>(name: string) {
    const f = new FileRef(name);
    const base = f.path.slice(0, -f.fullExtension.length);
    const view = this.#views[base];
    if (view === undefined) {
      throw fail("missing view component {0}", `${location.views}/${name}`);
    }
    return (view!.default ?? view) as T;
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

  render(content: Omit<FullViewOptions, keyof ResponseInit>) {
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
      .replace("%head%", render_head(this.#assets, head));
  }

  page(page?: string) {
    return this.loader().page(page);
  }

  respond(body: BodyInit | null, init?: ResponseInit) {
    const { headers, status } = pema({
      headers: record(string, string),
      status: uint.values(Status).default(Status.OK),
    }).parse(init);

    return new Response(body, {
      headers: {
        "Content-Type": TEXT_HTML, ...this.headers(), ...headers,
      }, status: status as number,
    });
  };

  view(options: FullViewOptions) {
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

  register(extension: string, viewFunction: ViewResponse) {
    if (this.#frontends[extension] !== undefined) {
      throw fail("double file extension {0}", extension);
    }
    this.#frontends[extension] = viewFunction;
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
    const modules = [
      this.#builtins.dev,
      ...this.modules,
      this.#builtins.handle,
    ].filter(m => m !== undefined);

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

  async route(request: RequestFacade) {
    const { original, url } = request;

    const pathname = normalize(url.pathname);
    const route = this.router.match(original);
    if (route === undefined) {
      log.info("no {0} route to {1}", original.method, pathname);
      return;
    }

    const verb = original.method.toLowerCase() as Verb;
    const { errors = [], guards = [], layouts = [] } = entries(route.specials)
      .map(([key, value]) => [`${key}s`, value ?? []])
      .map(([key, value]) => [key, value.map(v => {
        const verbs = router.get(v);
        const routeHandler = verbs[verb];
        if (routeHandler === undefined) {
          throw fail("route {0} has no {1} verb", route.path, verb);
        }
        return routeHandler.handler;
      })])
      .get();

    const verbs = router.get(route.path)!;
    const routePath = verbs[verb];

    if (routePath === undefined) {
      throw fail("route {0} has no {1} verb", route.path, verb);
    }

    const parseBody = routePath.options.parseBody;
    const body = parseBody ?? this.config("request.body.parse")
      ? await RequestBody.parse(original, url)
      : RequestBody.none();

    return {
      errors,
      guards,
      handler: routePath.handler,
      layouts,
      request: {
        ...request,
        body,
        path: new RequestBag(route.params as PartialDict<string>, "path", {
          normalize: k => k.toLowerCase(),
          raw: url.pathname,
        }),
      },
    };
  }

  get session() {
    return this.#init.session_config;
  };
}
