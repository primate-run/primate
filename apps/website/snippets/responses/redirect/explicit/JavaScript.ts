import Status from "@rcompat/http/Status";
import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    return response.redirect("https://primate.run", Status.SEE_OTHER);
  },
  post(request) {
    return response.redirect(`/login?next=${request.target}`);
  },
});
