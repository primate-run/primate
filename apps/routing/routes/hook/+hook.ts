import hook from "primate/route/hook";

hook((request, next) => {
  if (request.query.try("password") === "opensesame") return next(request);

  return "wrong";
});
