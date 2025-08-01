import type RequestFacade from "#RequestFacade";
import pass from "#pass";
import type PartialDict from "@rcompat/type/PartialDict";

export default (request: Request): RequestFacade => {
  const url = new URL(request.url);

  const headers = Object.fromEntries(request.headers.entries()) as
    PartialDict<string>;

  return {
    body: null,
    context: {},
    cookies: Object.fromEntries(headers.cookie?.split(";").map(cookie =>
      cookie.trim().split("=")) ?? []),
    headers,
    pass: (to: string) => pass(`${to}${url.pathname}`, request),
    path: {},
    query: Object.fromEntries(url.searchParams),
    request,
    url,
  };
};
