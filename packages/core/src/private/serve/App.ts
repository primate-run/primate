import App from "#App";
import type Asset from "#asset/Asset";
import type Font from "#asset/Font";
import type Script from "#asset/Script";
import type Style from "#asset/Style";
import type CSP from "#CSP";
import fail from "#fail";
import type ServerView from "#frontend/ServerView";
import type ViewOptions from "#frontend/ViewOptions";
import type ViewResponse from "#frontend/ViewResponse";
import hash from "#hash";
import type I18NConfig from "#i18n/Config";
import I18NModule from "#i18n/Module";
import location from "#location";
import log from "#log";
import reducer from "#reducer";
import parse from "#request/parse";
import RequestBag from "#request/RequestBag";
import RequestBody from "#request/RequestBody";
import type RequestFacade from "#request/RequestFacade";
import type Verb from "#request/Verb";
import type RouteHandler from "#route/Handler";
import router from "#route/router";
import type ServeInit from "#serve/Init";
import DevModule from "#serve/module/Dev";
import HandleModule from "#serve/module/Handle";
import SessionModule from "#session/SessionModule";
import tags from "#tags";
import assert from "@rcompat/assert";
import type { FileRef } from "@rcompat/fs";
import fs from "@rcompat/fs";
import FileRouter from "@rcompat/fs/FileRouter";
import type Actions from "@rcompat/http/Actions";
import type Conf from "@rcompat/http/Conf";
import MIME from "@rcompat/http/mime";
import serve from "@rcompat/http/serve";
import type Server from "@rcompat/http/Server";
import Status from "@rcompat/http/Status";
import is from "@rcompat/is";
import utf8 from "@rcompat/string/utf8";
import type { Dict, PartialDict } from "@rcompat/type";
import p from "pema";

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

const to_csp = (config_csp: Entry<CSP>[], assets: CSP, override: CSP) =>
  config_csp
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
  ).join("\n").concat("\n", rest
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
  #serve_assets: {
    client: PartialDict<{ mime: string; data: string }>;
    static: PartialDict<{ mime: string; data: string }>;
  };

  #pages: Dict<string>;
  #stores: Dict;
  #frontends: PartialDict<ViewResponse> = {};
  #router: FileRouter;
  #builtins: {
    dev?: DevModule;
    handle: HandleModule;
    session?: SessionModule;
    i18n?: I18NModule;
  };
  #i18n_config?: I18NConfig;
  constructor(rootfile: string, init: ServeInit) {
    const dir = fs.ref(rootfile).directory;
    super(dir, init.config, {
      mode: init.mode,
      target: init.target,
      dir: dir.path,
    });

    this.#init = init;
    this.#views = Object.fromEntries(init.views ?? []);
    this.#stores = Object.fromEntries((init.stores?.map(([k, s]) =>
      [k, s.default])) ?? []);
    this.#serve_assets = init.assets;
    this.#pages = init.pages;

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
        layout: { recursive: true },
        hook: { recursive: true },
      },
    }, init.routes.map(s => s[0]));

    this.#builtins = {
      dev: init.mode === "development" ? new DevModule(this) : undefined,
      handle: new HandleModule(this),
      session: init.session_config
        ? new SessionModule(this.secure, init.session_config)
        : undefined,
      i18n: init.i18n_config ? new I18NModule(init.i18n_config) : undefined,
    };
  };

  get secure() {
    const ssl = this.config("http.ssl");

    return ssl.key !== undefined && ssl.cert !== undefined;
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

  get stores() {
    return this.#stores;
  }

  get i18n() {
    return this.#i18n_config;
  }

  loadView<T = ServerView>(name: string) {
    const f = fs.ref(name).path;
    const frontends = Object.keys(this.frontends);
    const extension = frontends.find(frontend => f.endsWith(frontend));
    const base = extension === undefined ? name : f.slice(0, -extension.length);
    const view = this.#views[base];
    if (view === undefined) throw fail("no view {0}", name);
    if (view.default === undefined) {
      throw fail("view {0} must export a default component", name);
    }
    return view.default as T;
  };

  headers(csp = {}) {
    const base = Object.entries(this.config("http.csp") ?? {}) as Entry<CSP>[];

    return {
      ...this.config("http.headers") ?? {},
      ...base.length === 0 ? {} : {
        "Content-Security-Policy": to_csp(
          base,
          this.#csp,
          csp),
      },
    };
  };

  render(content: Omit<FullViewOptions, keyof ResponseInit>) {
    const { body, head, page, partial, placeholders = {} } = content;
    ["body", "head"].forEach(key => assert.undefined(placeholders[key]));

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

  body_length(body: BodyInit | null): number {
    return is.string(body) ? utf8.size(body) : 0;
  }

  respond(body: BodyInit | null, init?: ResponseInit) {
    const { headers, status } = p({
      headers: p.dict(),
      status: p.uint.values(Status).default(Status.OK),
    }).parse(init);
    const body_length = this.body_length(body);
    return new Response(body, {
      headers: {
        "Content-Type": MIME.TEXT_HTML,
        ...this.headers(),
        ...body_length ? {
          ...headers, "Content-Length": String(body_length),
        } : headers,
      }, status,
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
        src: fs.join(this.#init.config.http.static.root, src ?? "").path,
        type,
      });
    }

    // rehash assets_csp
    this.create_csp();
  };

  create_csp() {
    this.#csp = this.#assets.map(({ integrity, type: directive }) =>
      [`${directive === "style" ? "style" : "script"}-src`, integrity])
      .reduce((csp: CSP, [directive, _hash]) =>
      ({
        ...csp,
        [directive]: csp[directive as keyof CSP]!.concat(`'${_hash}'`),
      }),
        { "script-src": [], "style-src": [] },
      );
  };

  register(extension: string, viewFunction: ViewResponse) {
    if (this.#frontends[extension] !== undefined) {
      throw fail("double file extension {0}", extension);
    }
    this.#frontends[extension] = viewFunction;
  };

  page(name?: string) {
    const page_name = name ?? location.app_html;
    return this.#pages[page_name];
  }

  async #try_serve(ref: FileRef) {
    if (await ref.exists() && await ref.kind() === "file") {
      return new Response(ref.stream(), {
        headers: {
          "Content-Type": MIME.resolve(ref.name),
          "Content-Length": String(await ref.size()),
        },
        status: Status.OK,
      });
    }
  }

  async serve_assets(pathname: string) {
    const static_root = this.config("http.static.root");

    if (!pathname.startsWith(static_root)) return undefined;

    if (this.mode === "development") {
      const client_asset = this.root.join(location.client, pathname);
      const client_response = await this.#try_serve(client_asset);
      if (client_response !== undefined) return client_response;

      const static_asset = this.root.join("..", location.static, pathname);
      const static_response = await this.#try_serve(static_asset);
      if (static_response !== undefined) return static_response;

      return undefined;
    }

    const assets = this.#serve_assets;
    const asset = assets.client[pathname] ?? assets.static[pathname];
    if (asset === undefined) return undefined;

    const binary = atob(asset.data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return new Response(bytes, {
      headers: {
        "Content-Type": asset.mime,
        "Content-Length": String(bytes.length),
      },
      status: Status.OK,
    });
  }

  async start() {
    if (this.mode === "production") {
      this.#assets = await Promise.all(
        Object.entries(this.#serve_assets.client)
          .filter(([src]) => src.endsWith(".css") || src.endsWith(".js"))
          .map(async ([src, asset]) => {
            const type = src.endsWith(".css") ? "style" : "js";
            const code = atob(asset!.data);

            return {
              code,
              inline: false,
              integrity: await hash(code),
              src,
              type,
            };
          }));
    } else {
      const client_dir = this.root.join(location.client);
      const files = await client_dir.exists()
        ? await client_dir.files({
          recursive: true,
          filter: info => info.extension === ".js" || info.extension === ".css",
        })
        : [];

      this.#assets = await Promise.all(
        files.map(async (file) => {
          const type = file.extension === ".css" ? "style" : "js";
          const code = await file.text();

          return {
            code,
            inline: false,
            integrity: await hash(code),
            src: `/${file.name}`,
            type,
          };
        }));
    }
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
        return new Response(null, {
          headers: {
            "Content-Length": String(0),
            "Cache-Control": "no-cache",
          },
          status: Status.INTERNAL_SERVER_ERROR,
        });
      }
    }, {
      ...this.get<Conf>(s_http),
      timeout: this.mode === "development" ? 0 : undefined,
    });

    function bright(x: unknown) {
      return `\x1b[38;2;0;200;255m${x}\x1b[0m`;
    }
    log.print(`» app url     ${bright(this.url)}\n`);
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
    const specials = route.specials;
    const errors = (specials.error ?? [])
      .map(v => router.get(v)[verb]?.handler)
      .filter(Boolean)
      .toReversed() as RouteHandler[];
    const layouts = (specials.layout ?? [])
      .map(v => router.get(v)[verb]?.handler)
      .filter(Boolean)
      .toReversed() as RouteHandler[];
    const hooks = (specials.hook ?? [])
      .toReversed()
      .flatMap(v => router.getHooks(v));
    const verbs = router.get(route.path)!;
    const route_path = verbs[verb];

    if (route_path === undefined) {
      throw fail("route {0} has no {1} verb", route.path, verb);
    }

    const handler = route_path.handler;
    const parse_body = route_path.options.parseBody;
    const body = parse_body ?? this.config("request.body.parse")
      ? await RequestBody.parse(original, url)
      : RequestBody.none();
    const refined = Object.assign(Object.create(request), {
      body,
      path: new RequestBag(route.params as PartialDict<string>, "path", {
        normalize: k => k.toLowerCase(),
        raw: url.pathname,
      }),
    });

    return { errors, hooks, layouts, handler, request: refined };
  }
}
