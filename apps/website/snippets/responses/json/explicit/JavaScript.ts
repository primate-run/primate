import response from "primate/response";
import Status from "primate/http/Status";
import route from "primate/route";

export default route({
  get() {
    return response.json([
      { name: "Donald" },
      { name: "John" },
    ], { status: Status.CREATED });
  },
});
