import App from "#App";
import { s_config } from "#app/Facade";
import type Asset from "#asset/Asset";
import type Font from "#asset/Font";
import type Script from "#asset/Script";
import type Style from "#asset/Style";
import type ServerView from "#client/ServerView";
import type ViewOptions from "#client/ViewOptions";
import type ViewResponse from "#client/ViewResponse";
import type CSP from "#CSP";
import E from "#errors";
import hash from "#hash";
import type I18NConfig from "#i18n/Config";
import i18n_module from "#i18n/module";
import location from "#location";
import create from "#module/create";
import handle from "#request/handle";
import parse from "#request/parse";
import RequestBag from "#request/RequestBag";
import RequestBody from "#request/RequestBody";
import type RequestFacade from "#request/RequestFacade";
import route from "#request/route";
import request_storage from "#request/storage";
import type RouteHandler from "#route/Handler";
import router from "#route/router";
import dev_module from "#serve/dev-module";
import type ServeInit from "#serve/Init";
import session_module from "#session/module";
import tags from "#tags";
import assert from "@rcompat/assert";
import type { FileRef } from "@rcompat/fs";
import fs from "@rcompat/fs";
import FileRouter from "@rcompat/fs/FileRouter";
import type { Actions, Conf, Method, Server } from "@rcompat/http";
import http from "@rcompat/http";
import serve from "@rcompat/http/serve";
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
  #frontends: Map<string, ViewResponse> = new Map();
  #router: FileRouter;
  #i18n_config?: I18NConfig;
  constructor(rootfile: string, init: ServeInit) {
    const dir = fs.ref(rootfile).directory;
    super(dir, init.facade[s_config], {
      mode: init.mode,
      target: init.target,
      outdir: dir.path,
      log: init.log,
    });

    this.#init = init;
    this.#views = Object.fromEntries(init.views ?? []);
    this.#stores = Object.fromEntries((init.stores?.map(([k, s]) =>
      [k, s.default])) ?? []);
    this.#serve_assets = init.assets;
    this.#pages = init.pages;

    const http_config = this.#init.facade[s_config].http;
    this.#i18n_config = init.i18n;

    this.set(s_http, {
      host: http_config.host,
      port: http_config.port,
      ssl: this.secure ? {
        cert: this.root.join(http_config.ssl.cert!),
        key: this.root.join(http_config.ssl.key!),
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

    if (init.mode === "development") this.register(dev_module());

    const assets = this.serve_assets.bind(this);
    const bound_route = (request: RequestFacade) => route(this, request);

    if (init.session !== undefined) {
      this.register(session_module(init.session));
    }

    if (init.i18n !== undefined) this.register(i18n_module(init.i18n));

    this.register(create({
      name: "builtin/handle",
      setup({ onHandle }) {
        onHandle(async request => {
          const asset = await assets(request.url.pathname);
          if (asset !== undefined) return asset;

          return new Promise<Response>((resolve, reject) => {
            request_storage().run(request, async () => {
              try {
                resolve(await bound_route(request));
              } catch (e) {
                reject(e);
              }
            });
          });
        });
      },
    }));
  };

  get secure() {
    const ssl = this.config("http.ssl");

    return ssl.key !== undefined && ssl.cert !== undefined;
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
    return Object.fromEntries(this.#frontends);
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
    const extension = frontends.find(client => f.endsWith(client));
    const base = is.undefined(extension) ? name : f.slice(0, -extension.length);
    const view = this.#views[base];
    if (is.undefined(view)) throw E.view_missing(name);
    if (is.undefined(view.default)) throw E.view_missing_default_export(name);
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

    return partial === true ? body : Object.entries(placeholders)
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
      status: p.uint.values(http.Status).default(http.Status.OK),
    }).parse(init);
    const body_length = this.body_length(body);
    return new Response(body, {
      headers: {
        "Content-Type": http.MIME.TEXT_HTML,
        ...this.headers(),
        ...body_length ? {
          ...headers, "Content-Length": String(body_length),
        } : headers,
      }, status,
    });
  };

  view(options: FullViewOptions) {
    // split render and respond options
    const { headers = {}, status = http.Status.OK, statusText, ...rest } = options;
    return this.respond(this.render(rest), { headers, status });
  };

  media(content_type: string, response: ResponseInit = {}): ResponseInit {
    return {
      headers: { ...response.headers, "Content-Type": content_type },
      status: response.status ?? http.Status.OK,
    };
  };

  async publish({ code, inline = false, src, type = "" }: PublishOptions) {
    if (inline || type === "style") {
      this.#assets.push({
        code: inline ? code : "",
        inline,
        integrity: await hash(code),
        src: fs.join(this.config("http.static.root"), src ?? "").path,
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

  frontend(extension: string, view_response: ViewResponse) {
    if (this.#frontends.has(extension)) {
      throw E.view_duplicate_extension(extension);
    }
    this.#frontends.set(extension, view_response);
  };

  page(name?: string) {
    const page_name = name ?? location.app_html;
    return this.#pages[page_name];
  }

  async #try_serve(ref: FileRef) {
    if (await ref.exists() && await ref.type() === "file") {
      return new Response(ref.stream(), {
        headers: {
          "Content-Type": http.MIME.resolve(ref.name),
          "Content-Length": String(await ref.size()),
        },
        status: http.Status.OK,
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
    if (is.undefined(asset)) return undefined;

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
      status: http.Status.OK,
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

    this.#server = await serve(async request => {
      try {
        return await handle(this, parse(request));
      } catch (error) {
        this.log.error(error);
        return new Response(null, {
          headers: {
            "Content-Length": String(0),
            "Cache-Control": "no-cache",
          },
          status: http.Status.INTERNAL_SERVER_ERROR,
        });
      }
    }, {
      ...this.get<Conf>(s_http),
      timeout: this.mode === "development" ? 0 : undefined,
    });

    function bright(x: unknown) {
      return `\x1b[38;2;0;200;255m${x}\x1b[0m`;
    }
    this.log.print`» app url     ${bright(this.url)}\n`;
  };

  stop() {
    this.#server!.stop();
    this.log.system`stopped ${this.url}`;
  };

  upgrade(request: Request, actions: Actions) {
    return this.#server!.upgrade(request, actions);
  }

  async route(request: RequestFacade) {
    const { original, url } = request;
    const pathname = normalize(url.pathname);
    const matched = this.router.match(original);
    if (is.undefined(matched)) {
      this.log.trace`no ${original.method} route to ${pathname}`;
      return undefined;
    }

    const method = original.method.toLowerCase() as Method;
    const specials = matched.specials;
    const errors = (specials.error ?? [])
      .map(v => router.get(v)[method]?.handler)
      .filter(Boolean)
      .toReversed() as RouteHandler[];
    const layouts = (specials.layout ?? [])
      .map(v => router.get(v)[method]?.handler)
      .filter(Boolean)
      .toReversed() as RouteHandler[];
    const hooks = (specials.hook ?? [])
      .toReversed()
      .flatMap(v => router.getHooks(v));
    const methods = router.get(matched.path)!;
    const is_head = method === "head";
    const actual_method = is_head && is.undefined(methods.head) ? "get" : method;

    const route_path = methods[actual_method];

    if (is.undefined(route_path)) {
      this.log.trace`${matched.path} has no method ${method}`;
      return undefined;
    }

    const handler = route_path.handler;
    const parse_body = route_path.options.parseBody;
    const body = parse_body ?? this.config("request.body.parse")
      ? await RequestBody.parse(original, url)
      : RequestBody.none();
    const refined = Object.assign(Object.create(request), {
      body,
      path: new RequestBag(matched.params as PartialDict<string>, "path", {
        normalize: k => k.toLowerCase(),
        raw: url.pathname,
      }),
    });

    return { errors, hooks, layouts, handler, request: refined, is_head };
  }
}
