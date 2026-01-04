import RequestBag from "#request/RequestBag";
import RequestBody from "#request/RequestBody";
import RequestContext from "#request/RequestContext";
import type RequestFacade from "#request/RequestFacade";
import sContext from "#request/sContext";
import type { Dict } from "@rcompat/type";

function decode(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

function normalize(k: string) {
  return k.toLowerCase();
}

function header_bag(request: Request) {
  const headers = Object.fromEntries([...request.headers].map(([k, v]) =>
    [k.toLowerCase(), v] as const));
  return new RequestBag(headers, "headers", {
    normalize,
  });
}

function cookie_bag(request: Request) {
  const header = request.headers.get("cookie");
  const entries = Object.fromEntries(header
    ? header.split(";").map(s => s.trim()).filter(Boolean).map(s => {
      const i = s.indexOf("=");
      const key = i === -1 ? s : s.slice(0, i);
      const value = i === -1 ? "" : s.slice(i + 1);
      return [decode(key), decode(value)] as const;
    })
    : []);
  return new RequestBag(entries, "cookies", {
    raw: header ?? "",
  });
}

function query_bag(url: URL) {
  return new RequestBag(Object.fromEntries(url.searchParams), "query", {
    normalize,
    raw: url.search,
  });
}

function path_bag(url: URL) {
  return new RequestBag(Object.create(null), "path", { raw: url.pathname });
}

function parse(request: Request): RequestFacade {
  const url = new URL(request.url);
  const facade: RequestFacade = {
    body: RequestBody.none(),
    cookies: cookie_bag(request),
    forward(to: string, headers?: Dict<string>) {
      return fetch(to, {
        body: request.body,
        duplex: "half",
        headers: {
          ...headers,
          "Content-Type": request.headers.get("Content-Type"),
        },
        method: request.method,
      } as RequestInit);
    },
    headers: header_bag(request),
    original: request,
    path: path_bag(url),
    query: query_bag(url),
    target: url.pathname + url.search,
    url,
    has(key) {
      return this[sContext].has(key);
    },
    try<T>(key: string) {
      return this[sContext].try<T>(key);
    },
    get<T>(key: string) {
      return this[sContext].get<T>(key);
    },

    set<T>(key: string, value: T | ((prev: T | undefined) => T)) {
      if (typeof value === "function") {
        this[sContext].update<T>(key, value as any);
      } else {
        this[sContext].set<T>(key, value);
      }
      return this;
    },

    delete(key: string) {
      this[sContext].delete(key);
      return this;
    },

    toJSON() {
      return {
        context: this[sContext].toJSON(),
        cookies: this.cookies.toJSON(),
        headers: this.headers.toJSON(),
        path: this.path.toJSON(),
        query: this.query.toJSON(),
        url: this.url,
      };
    },
  };

  Object.defineProperty(facade, sContext, {
    value: new RequestContext(),
    enumerable: false,
    configurable: false,
    writable: false,
  });

  return facade;
};

export default parse;
