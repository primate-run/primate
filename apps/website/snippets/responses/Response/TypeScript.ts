import Status from "primate/response/Status";
import route from "primate/route";

route.get(() => new Response("Hi!", {
  status: Status.ACCEPTED,
  headers: { "X-Custom": "1" },
}));
