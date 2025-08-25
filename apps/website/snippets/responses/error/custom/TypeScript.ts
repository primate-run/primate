import Status from "@rcompat/http/Status";
import error from "primate/response/error";
import route from "primate/route";

route.get(() => error({
  status: Status.INTERNAL_SERVER_ERROR,
}));
