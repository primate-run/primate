import type Verb from "#request/Verb";
import verbs from "#request/verbs";
import type RouteFunction from "#route/RouteFunction";
import router from "#route/router";

type Route = {
  [key in Verb]: (route: RouteFunction) => void;
};

export default Object.fromEntries(verbs.map(verb =>
  [verb, (route: RouteFunction) => {
    router.add(verb, route);
  }])) as Route;
