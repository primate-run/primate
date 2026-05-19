import App from "#App";
import { s_config } from "#app/Facade";
import type Asset from "#asset/Asset";
import type Font from "#asset/Font";
import type Script from "#asset/Script";
import type Style from "#asset/Style";
import Bag from "#Bag";
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
import { BodyPatch } from "#request/RequestBody";
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

function entrypoint_name(src: string) {
  const file = src.split("/").at(-1) ?? src;
  return file.replace(/-[A-Z0-9]+(?=\.(?:js|css)$)/i, "")
    .replace(/\.(?:js|css)$/i, "");
}

function render_entrypoint(asset: Asset) {
  if (asset.type === "style") {
    return tags.style({
      code: asset.code as string,
      href: asset.src,
      inline: asset.inline,
    } as Style);
  }

  return tags.script({
    code: asset.code as string,
    inline: asset.inline,
    integrity: asset.integrity,
    src: asset.src,
    type: "module",
  } as Script);
}

function render_entrypoints(assets: Asset[], names: string[]) {
  return Object.fromEntries(names.map(name => {
    const asset = assets.find(asset =>
      asset.src !== undefined && entrypoint_name(asset.src) === name);

    if (asset === undefined) {
      throw new Error(`entrypoint ${name} not emitted`);
    }

    return [name, render_entrypoint(asset)];
  }));
}

const s_http = Symbol("s_http");

const content_type_method = {
  "application/json": "json",
  "text/plain": "text",
  "application/x-www-form-urlencoded": "form",
  "multipart/form-data": "multipart",
  "application/octet-stream": "blob",
} as const;

const asset_extensions = [".js", ".css", ".woff2"];

export default class ServeApp extends App {
  #init: ServeInit;
  #server?: Server;
  #views: Bag;
  #csp: CSP = {};
  #assets: Asset[] = [];
  #serve_assets: {
    client: PartialDict<{ mime: string; data: string }>;
    static: PartialDict<{ mime: string; data: string }>;
  };

  #pages: Dict<string>;
  #frontends: Map<string, ViewResponse> = new Map();
  #router: FileRouter;
  #i18n_config?: I18NConfig;
  #entrypoints: Dict<string> = {};

  constructor(rootfile: string, init: ServeInit) {
    const dir = fs.ref(rootfile).directory;
    super(dir, init.facade[s_config], {
      mode: init.mode,
      target: init.target,
      outdir: dir.path,
      log: init.log,
    });

    this.#init = init;
    this.#views = new Bag(
      (init.views ?? []).map(([k, v]) => {
        if (is.undefined(v.default)) throw E.view_missing_default_export(k);
        return [k, v.default] as [string, ServerView];
      }),
      name => {
        const f = fs.ref(name).path;
        const extension = Object.keys(this.frontends).find(e => f.endsWith(e));
        return is.undefined(extension) ? name : f.slice(0, -extension.length);
      },
    );
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
  }

  get assets() {
    return this.#assets;
  }

  get router() {
    return this.#router;
  }

  get frontends() {
    return Object.fromEntries(this.#frontends);
  }

  get i18n() {
    return this.#i18n_config;
  }

  get views() {
    return this.#views;
  }

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

    const all_placeholders = {
      ...this.#entrypoints,
      ...placeholders,
    };
    const entrypoint_names = Object.keys(this.config("entrypoints") ?? {});

    return partial === true ? body : Object.entries(all_placeholders)
      // replace given placeholders, defaulting to ""
      .reduce((rendered, [key, value]) => rendered
        .replaceAll(`%${key}%`, value?.toString() ?? ""), this.page(page))
      // replace non-given placeholders, aside from %body% / %head%
      .replaceAll(/(?<keep>%(?:head|body)%)|%.*?%/gus, "$1")
      // replace body and head
      .replace("%body%", body)
      .replace("%head%", render_head(
        this.#assets.filter(asset =>
          asset.src === undefined
          || !entrypoint_names.includes(entrypoint_name(asset.src)),
        ),
        head,
      ));
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
          "Content-Type": http.toMIME(ref.name),
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
          .filter(([src]) => asset_extensions.some(ext => src.endsWith(ext)))
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
          filter: info => asset_extensions.includes(info.extension),
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

    this.#entrypoints = render_entrypoints(
      this.#assets,
      Object.keys(this.config("entrypoints") ?? {}),
    );

    this.create_csp();

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
    const pathname = normalize(request.url.pathname);
    const matched = this.router.match(request.original);
    if (is.undefined(matched)) {
      this.log.trace`no ${request.method} route to ${pathname}`;
      return undefined;
    }

    const method = request.method.toLowerCase() as Method;
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

    const { contentType, body, path } = route_path.options;

    if (contentType !== undefined) {
      const raw = request.headers.try("content-type") ?? "";
      const actual = raw.split(";")[0].trim().toLowerCase();
      if (actual !== contentType) {
        throw E.request_content_type_mismatch(contentType, actual);
      }
    }

    const refined = Object.assign(Object.create(request), {
      path: new RequestBag(is.defined(path)
        ? path.parse(matched.params) as PartialDict<string>
        : matched.params as PartialDict<string>,
        "path",
        {
          normalize: k => k.toLowerCase(),
          raw: request.url.pathname,
        },
      ),
      ...(body !== undefined && contentType !== undefined
        ? { body: request.body[BodyPatch]({ contentType, schema: body }) }
        : {}),
    });

    return { errors, hooks, layouts, handler, request: refined, is_head };
  }
}
