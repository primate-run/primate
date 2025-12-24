import RequestBag from "#request/RequestBag";
import RequestBody from "#request/RequestBody";
import type RequestFacade from "#request/RequestFacade";
import type { Dict } from "@rcompat/type";

function decode(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

const normalize = (k: string) => k.toLowerCase();

function bagHeaders(request: Request) {
  const headers = Object.fromEntries([...request.headers].map(([k, v]) =>
    [k.toLowerCase(), v] as const));
  return new RequestBag(headers, "headers", {
    normalize,
  });
}

function bagCookies(request: Request) {
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

function bagQuery(url: URL) {
  return new RequestBag(Object.fromEntries(url.searchParams), "query", {
    normalize,
    raw: url.search,
  });
}

function bagPath(url: URL) {
  return new RequestBag(Object.create(null), "path", {
    raw: url.pathname,
  });
}

export default (request: Request): RequestFacade => {
  const url = new URL(request.url);

  return {
    body: RequestBody.none(),
    context: {},
    cookies: bagCookies(request),
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
    headers: bagHeaders(request),
    original: request,
    path: bagPath(url),
    query: bagQuery(url),
    target: url.pathname + url.search,
    url,
  };
};
