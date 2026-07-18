import Status from "@rcompat/http/Status";
import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    return response.view("Login.jsx");
  },
  post(request) {
    // do verification work, create session, etc.

    return response.redirect.local(request.query.try("next") ?? "/", {
      status: Status.SEE_OTHER,
    });
  },
});
