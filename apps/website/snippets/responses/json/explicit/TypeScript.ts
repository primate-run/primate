import response from "primate/response";
import Status from "primate/response/Status";
import route from "primate/route";

route.get(() => response.json([
  { name: "Donald" },
  { name: "John" },
], { status: Status.CREATED }));
