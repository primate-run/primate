import route from "primate/route";

route.get(request => {
  if (request.query.try("password") == "opensesame") {
    return null;
  }
  return "wrong";
});
