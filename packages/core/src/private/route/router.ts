import type Verb from "#request/Verb";
import type RouteFunction from "#route/RouteFunction";
import type RoutePath from "#route/RoutePath";
import assert from "@rcompat/assert";

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

  add(verb: Verb, route: RouteFunction) {
    assert(this.active !== undefined);

    const active = this.active!;
    const routes = this.#routes;

    if (!(active in routes)) {
      routes[active] = {};
    }

    routes[active][verb] = route;
  }

  get(path: string) {
    return { ...this.#routes[path] };
  }
}

export default new Router();
