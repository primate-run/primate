import type RequestBag from "#request/RequestBag";
import type RequestBody from "#request/RequestBody";
import type Dict from "@rcompat/type/Dict";

type RequestFacade = {
  body: RequestBody;
  context: Dict;
  cookies: RequestBag;
  headers: RequestBag;
  pass(to: string): Promise<Response>;
  path: RequestBag;
  query: RequestBag;
  request: Request;
  url: URL;
} & Dict<Dict | unknown>;

export { RequestFacade as default };
