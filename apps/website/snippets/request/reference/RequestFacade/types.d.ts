import type RequestBag from "@primate/core/request/RequestBag";
import type RequestBody from "@primate/core/request/RequestBody";

interface RequestFacade {
  body: RequestBody;
  path: RequestBag;
  query: RequestBag;
  headers: RequestBag;
  cookies: RequestBag;
  context: Record<string, unknown>;
  original: Request;
  url: URL;
  forward(to: string, headers?: Record<string, string>): Promise<Response>;
}
