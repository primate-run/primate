import response from "primate/response";
import Status from "primate/http/Status";
import route from "primate/route";

route.get(() => response.json([
  { name: "Donald" },
  { name: "John" },
], { status: Status.CREATED }));
