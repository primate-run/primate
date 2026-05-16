import route from "primate/route";

export default route.hook((request, next) => {
  if (request.query.try("password") === "opensesame") return next(request);

  return "wrong";
});
