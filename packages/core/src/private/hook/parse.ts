import type RequestFacade from "#RequestFacade";
import pass from "#pass";
import type PartialDict from "@rcompat/type/PartialDict";

export default (request: Request): RequestFacade => {
  const url = new URL(request.url);

  const headers = Object.fromEntries(request.headers.entries()) as
    PartialDict<string>;

  return {
    context: {},
    body: null,
    request,
    url,
    query: Object.fromEntries(url.searchParams),
    headers,
    cookies: Object.fromEntries(headers.cookie?.split(";").map(cookie =>
      cookie.trim().split("=")) ?? []),
    path: {},
    pass: (to: string) => pass(`${to}${url.pathname}`, request),
  };
};
