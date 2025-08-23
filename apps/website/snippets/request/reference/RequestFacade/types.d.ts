import type RequestBag from "@primate/core/request/RequestBag";
import type RequestBody from "@primate/core/request/RequestBody";
import type Dict from "@rcompat/type/Dict";

interface RequestFacade {
  body: RequestBody;
  context: Dict;
  cookies: RequestBag;
  headers: RequestBag;
  pass(to: string): Promise<Response>;
  path: RequestBag;
  query: RequestBag;
  original: Request;
  url: URL;
}
