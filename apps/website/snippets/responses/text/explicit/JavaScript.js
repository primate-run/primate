import Status from "primate/http/Status";
import response from "primate/response";
import route from "primate/route";

route.post(request => {
  return response.text("Hello from TypeScript!", { status: Status.CREATED });
});
