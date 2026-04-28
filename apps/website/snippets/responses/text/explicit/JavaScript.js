import http from "@rcompat/http";
import response from "primate/response";
import route from "primate/route";

export default route({
  post(request) {
    return response.text("Hello JavaScript!", { status: http.Status.CREATED });
  },
});
