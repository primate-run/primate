import router from "#router";
import type RouteFunction from "#RouteFunction";
import type Verb from "#Verb";
import verbs from "#verbs";

type Route = {
  [key in Verb]: (route: RouteFunction) => void;
};

export default Object.fromEntries(verbs.map(verb =>
  [verb, (route: RouteFunction) => {
    router.add(verb, route);
  }])) as Route;
