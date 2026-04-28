import http from "@rcompat/http";
import route from "primate/route";

export default route({
  get() {
    return new Response("Hi!", {
      status: http.Status.ACCEPTED,
      headers: { "X-Custom": "1" },
    });
  },
});
