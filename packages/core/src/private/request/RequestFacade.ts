import type RequestBag from "#request/RequestBag";
import type RequestBody from "#request/RequestBody";
import type Dict from "@rcompat/type/Dict";

type RequestFacade = {
  body: RequestBody;
  context: Dict;
  cookies: RequestBag;
  headers: RequestBag;
  original: Request;
  pass(to: string): Promise<Response>;
  path: RequestBag;
  query: RequestBag;
  url: URL;
} & Dict<Dict | unknown>;

export { RequestFacade as default };
