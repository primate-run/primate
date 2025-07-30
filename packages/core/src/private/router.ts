import type RouteFunction from "#RouteFunction";
import type Verb from "#Verb";
import assert from "@rcompat/assert";

class Router {
  #routes: Record<string, { [key in Verb]?: RouteFunction; }> = {};
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
