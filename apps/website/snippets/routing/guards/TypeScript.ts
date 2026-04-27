import response from "primate/response";
import route from "primate/route";

export default route({
  get(request) {
    if (request.headers.get("Authorization") !== "opensesame") {
      return response.redirect("/somewhere-else");
    }
    // explicit pass
    return null;
  },
});
