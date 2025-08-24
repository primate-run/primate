import json from "primate/response/json";
import Status from "primate/response/Status";
import route from "primate/route";

route.get(() => json([
  { name: "Donald" },
  { name: "John" },
], { status: Status.CREATED }));
