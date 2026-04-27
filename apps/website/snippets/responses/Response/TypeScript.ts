import Status from "primate/http/Status";
import route from "primate/route";

export default route({
  get() {
    return new Response("Hi!", {
      status: Status.ACCEPTED,
      headers: { "X-Custom": "1" },
    });
  },
});
