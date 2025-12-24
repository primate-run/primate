import type Verb from "#request/Verb";
import type RouteHandler from "#route/Handler";
import type RouteOptions from "#route/Options";
import type RoutePath from "#route/Path";
import assert from "@rcompat/assert";

const stack: string[] = [];
export const routes = stack;

class Router {
  #routes: Record<string, RoutePath> = {};

  push(route: string) {
    stack.push(route);
  }

  pop() {
    stack.pop();
  }

  get active() {
    return stack.at(-1);
  }

  add(verb: Verb, handler: RouteHandler, options?: RouteOptions) {
    assert.defined(this.active);
    assert.function(handler);
    assert.maybe.dict(options);
    assert.maybe.boolean(options?.parseBody);

    const active = this.active!;
    const routes = this.#routes;

    if (!(active in routes)) routes[active] = {};

    routes[active][verb] = { handler, options: options ?? {} };
  }

  get(path: string) {
    return { ...this.#routes[path] };
  }
}

export default new Router();
