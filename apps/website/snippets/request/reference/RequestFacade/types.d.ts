import type { RequestBag, RequestBody } from "@primate/core/request";

type Dict<V = unknown> = Record<string, V>;

interface RequestView {
  context: Dict;
  cookies: Dict<string>;
  headers: Dict<string>;
  path: Dict<string>;
  query: Dict<string>;
  url: URL;
}

interface RequestFacade {
  body: RequestBody;
  path: RequestBag;
  query: RequestBag;
  headers: RequestBag;
  cookies: RequestBag;
  original: Request;
  target: string; // pathname + querystring
  url: URL;
  forward(to: string, headers?: Dict): Promise<Response>;

  has(key: string): boolean;
  try<T>(key: string): T | undefined;
  get<T>(key: string): T;
  set<T>(key: string, value: T | ((prev: T | undefined) => T)): RequestFacade;
  delete(key: string): RequestFacade;

  toJSON(): RequestView;
}
