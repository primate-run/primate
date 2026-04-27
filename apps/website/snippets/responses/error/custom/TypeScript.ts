import Status from "@rcompat/http/Status";
import response from "primate/response";
import route from "primate/route";

export default route({
  get(request) {
    return response.error({
      status: Status.INTERNAL_SERVER_ERROR,
    });
  },
});
