import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    return response.view("Login.jsx");
  },
  post(request) {
    // do verification work, create session, etc.

    return response.redirect(request.query.get("next"));
  },
});
