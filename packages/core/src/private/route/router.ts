import E from "#errors";
import type RequestHook from "#module/RequestHook";
import type RouteHandler from "#route/Handler";
import type RouteOptions from "#route/Options";
import type RoutePath from "#route/Path";
import assert from "@rcompat/assert";
import type { Method } from "@rcompat/http";
import type { Dict } from "@rcompat/type";

function is_hook_file(p: string) {
  const basename = p.split("/").at(-1) ?? p;
  return basename === "+hook" || basename.startsWith("+hook.");
}

class Router {
  #routes: Dict<RoutePath> = {};
  #hooks: Dict<RequestHook[]> = {};

  add(path: string, method: Method, handler: RouteHandler, options?: RouteOptions) {
    assert.string(path);
    assert.string(method);
    assert.function(handler);
    assert.maybe.dict(options);

    if (is_hook_file(path)) throw E.hook_route_functions_not_allowed(path);

    if (!(path in this.#routes)) this.#routes[path] = {};
    this.#routes[path][method] = { handler, options: options ?? {} };
  }

  addHook(path: string, fn: RequestHook) {
    assert.string(path);
    assert.function(fn);

    if (!is_hook_file(path)) throw E.hook_not_allowed(path);
    (this.#hooks[path] ??= []).push(fn);
  }

  getHooks(path: string) {
    return [...(this.#hooks[path] ?? [])];
  }

  verifyHook(path: string) {
    if ((this.#hooks[path] ?? []).length === 0) throw E.hook_unused(path);
  }

  get(path: string) {
    return { ...this.#routes[path] };
  }
}

export default new Router();
