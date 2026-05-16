import route from "primate/route";

export default route.hook((request, next) => {
  return next(request.set("foo", "outer"));
});
