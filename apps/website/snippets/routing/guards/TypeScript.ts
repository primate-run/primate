import redirect from "primate/response/redirect";
import route from "primate/route";

route.get(request => {
  if (request.headers.get("Authorization") !== "opensesame") {
    return redirect("/somewhere-else");
  }
  // explicit pass
  return null;
});
