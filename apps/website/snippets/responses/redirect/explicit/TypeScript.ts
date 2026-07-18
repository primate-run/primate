import Status from "@rcompat/http/Status";
import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    return response.redirect.external("https://primate.run", {
      allowedOrigins: ["https://primate.run"],
      status: Status.SEE_OTHER,
    });
  },
  post(request) {
    return response.redirect.local({
      pathname: "/login",
      query: { next: request.target },
    }, { status: Status.SEE_OTHER });
  },
});
