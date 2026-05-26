import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    return response.view("Redirect.marko");
  },
  post() {
    return response.redirect("/redirected");
  },
});
