import type RequestBag from "#request/RequestBag";
import type RequestBody from "#request/RequestBody";
import type Dict from "@rcompat/type/Dict";

type RequestFacade = {
  body: RequestBody;
  context: Dict;
  cookies: RequestBag;
  forward(to: string, headers?: Dict<string>): Promise<Response>;
  headers: RequestBag;
  original: Request;
  path: RequestBag;
  query: RequestBag;
  /**
   * The request's pathname + querystring.
   */
  target: string;
  url: URL;
} & Dict<Dict | unknown>;

export { RequestFacade as default };
