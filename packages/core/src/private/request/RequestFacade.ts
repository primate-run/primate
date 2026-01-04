import type RequestBag from "#request/RequestBag";
import type RequestBody from "#request/RequestBody";
import type sContext from "#request/sContext";
import type { Dict } from "@rcompat/type";
import type RequestContext from "#request/RequestContext";

type RequestView = {
  context: Dict;
  cookies: Dict<string>;
  headers: Dict<string>;
  path: Dict<string>;
  query: Dict<string>;
  url: URL;
};

type RequestFacade = {
  [sContext]: RequestContext;
  body: RequestBody;
  cookies: RequestBag;
  forward(to: string, headers?: Dict<string>): Promise<Response>;
  headers: RequestBag;
  original: Request;
  path: RequestBag;
  query: RequestBag;
  target: string; // pathname + querystring
  url: URL;

  has(key: string): boolean;
  try<T>(key: string): T | undefined;
  get<T>(key: string): T;
  set<T>(key: string, value: T | ((prev: T | undefined) => T)): RequestFacade;
  delete(key: string): RequestFacade;

  toJSON(): RequestView;
};

export { RequestFacade as default };
