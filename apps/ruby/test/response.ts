import Status from "primate/http/Status";
import test from "primate/test";

test.get("/response/error", response => {
  response.status.equals(Status.NOT_FOUND);
  response.body.includes("Ruby error");
});

test.get("/response/redirect", response => {
  response.status.equals(Status.FOUND);
  response.headers.includes({ location: "/redirected" });
});

test.get("/response/view", response => {
  response.body.includes("<h1>View</h1>Hello, world.");
});
