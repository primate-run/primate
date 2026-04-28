import response from "primate/response";
import http from "@rcompat/http";
import route from "primate/route";

export default route({
  get() {
    return response.json([
      { name: "Donald" },
      { name: "John" },
    ], { status: http.Status.CREATED });
  },
});
