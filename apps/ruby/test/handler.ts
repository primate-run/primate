import Status from "primate/http/Status";
import test from "primate/test";

test.get("/handler/error", response => {
  response.status.equals(Status.NOT_FOUND);
  response.body.includes("Ruby error");
});

test.get("/handler/redirect", response => {
  response.status.equals(Status.FOUND);
  response.headers.includes({ location: "/redirected" });
});

test.get("/handler/view", response => {
  response.body.includes(`<h1>View</h1>Hello, world.`);
});
