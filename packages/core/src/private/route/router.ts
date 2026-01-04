import fail from "#fail";
import type RequestHook from "#module/RequestHook";
import type Verb from "#request/Verb";
import type RouteHandler from "#route/Handler";
import type RouteOptions from "#route/Options";
import type RoutePath from "#route/Path";
import assert from "@rcompat/assert";
import type { Dict } from "@rcompat/type";

const stack: string[] = [];
export const routes = stack;

function is_hook_file(p: string) {
  const basename = p.split("/").at(-1) ?? p;
  return basename === "+hook" || basename.startsWith("+hook.");
}

class Router {
  #routes: Dict<RoutePath> = {};
  #hooks: Dict<RequestHook[]> = {};

  push(route: string) { stack.push(route); }
  pop() { stack.pop(); }

  get active() { return stack.at(-1); }

  add(verb: Verb, handler: RouteHandler, options?: RouteOptions) {
    assert.string(verb);
    assert.function(handler);
    assert.maybe.dict(options);
    assert.maybe.boolean(options?.parseBody);

    const active = assert.defined(this.active);
    if (is_hook_file(active)) {
      throw fail("route.{0} may not be used inside {1}; use hook(...) instead",
        verb, active);
    }

    const routes = this.#routes;
    if (!(active in routes)) routes[active] = {};
    routes[active][verb] = { handler, options: options ?? {} };
  }

  addHook(fn: RequestHook) {
    assert.function(fn);

    const active = assert.defined(this.active);
    if (!is_hook_file(active)) {
      throw fail("hook(...) may only be used inside +hook files, got {0}",
        active);
    }

    (this.#hooks[active] ??= []).push(fn);
  }

  getHooks(path: string) {
    return [...(this.#hooks[path] ?? [])];
  }

  verifyHook(path: string) {
    if ((this.#hooks[path] ?? []).length === 0) {
      throw fail("hook file {0} did not register any hooks (call hook(...))",
        path);
    }
  }

  get(path: string) {
    return { ...this.#routes[path] };
  }
}

export default new Router();
