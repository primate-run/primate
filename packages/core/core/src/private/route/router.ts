import type Verb from "#request/Verb";
import type RouteHandler from "#route/Handler";
import type RouteOptions from "#route/Options";
import type RoutePath from "#route/Path";
import assert from "@rcompat/assert";
import is from "@rcompat/assert/is";
import maybe from "@rcompat/assert/maybe";

class Router {
  #routes: Record<string, RoutePath> = {};
  #stack: string[] = [];

  push(route: string) {
    this.#stack.push(route);
  }

  pop() {
    this.#stack.pop();
  }

  get active() {
    return this.#stack.at(-1);
  }

  add(verb: Verb, handler: RouteHandler, options: RouteOptions = {}) {
    assert(this.active !== undefined);
    is(handler).function();
    maybe(options).object();

    const active = this.active!;
    const routes = this.#routes;

    if (!(active in routes)) {
      routes[active] = {};
    }

    routes[active][verb] = { handler, options };
  }

  get(path: string) {
    return { ...this.#routes[path] };
  }
}

export default new Router();
