import hook from "primate/route/hook";

export default hook((request, next) => next(request.set("foo", "outer")));
