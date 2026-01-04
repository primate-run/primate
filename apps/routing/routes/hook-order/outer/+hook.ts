import hook from "primate/route/hook";

hook((request, next) => next(request.set("foo", "outer")));
