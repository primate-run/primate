import View from "@/views/RouteClient/ActionRedirect";
import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    return response.view(View);
  },

  post() {
    return response.redirect("/redirected");
  },
});
