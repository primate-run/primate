import response from "primate/response";
import Status from "primate/response/Status";
import route from "primate/route";

route.post(request => {
  return response.text("Hello from TypeScript!", { status: Status.CREATED });
});
