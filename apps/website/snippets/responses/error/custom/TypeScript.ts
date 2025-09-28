import Status from "@rcompat/http/Status";
import response from "primate/response";
import route from "primate/route";

route.get(() => response.error({
  status: Status.INTERNAL_SERVER_ERROR,
}));
