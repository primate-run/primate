import type RequestBag from "#request/RequestBag";
import type RequestBody from "#request/RequestBody";
import type RequestContext from "#request/RequestContext";
import type RequestView from "#request/RequestView";
import type sContext from "#request/sContext";
import type Verb from "#request/Verb";
import type { Dict } from "@rcompat/type";

type RequestFacade = {
  [sContext]: RequestContext;
  method: Verb;
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
