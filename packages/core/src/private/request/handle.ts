import type RequestFacade from "#request/RequestFacade";
import type ServeApp from "#serve/App";
import http from "@rcompat/http";
import type { MaybePromise } from "@rcompat/type";

type Next = (request: RequestFacade) => Promise<Response>;
type Hook = (request: RequestFacade, next: Next) => MaybePromise<Response>;

async function run(
  hooks: Hook[],
  request: RequestFacade,
): Promise<Response> {
  const [first, ...rest] = hooks;

  if (first === undefined) {
    return new Response(null, {
      headers: {
        "Content-Length": String(0),
        "Cache-Control": "no-cache",
      },
      status: http.Status.INTERNAL_SERVER_ERROR,
    });
  }

  return await first(request, next => run(rest, next));
}

export default function handle(app: ServeApp, request: RequestFacade) {
  return run(app.handle_hooks, request);
}
