import type RequestFacade from "#RequestFacade";
import forward from "#forward";
import type PartialDictionary from "@rcompat/type/PartialDictionary";

export default (request: Request): RequestFacade => {
  const url = new URL(request.url);

  const headers = Object.fromEntries(request.headers.entries()) as
    PartialDictionary<string>;

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
    pass: (to: string) => forward(`${to}${url.pathname}`, request),
  };
};
