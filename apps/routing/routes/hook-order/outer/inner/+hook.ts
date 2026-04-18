import hook from "primate/route/hook";

export default hook((request, next) => {
  return next(request.set<string>("foo", foo => foo + "inner"));
});
