import Status from "primate/response/Status";
import test from "primate/test";

test.get("/handler/error", response => {
  response.status.equals(Status.NOT_FOUND);
});

test.get("/handler/error-options", response => {
  response.status.equals(Status.NOT_FOUND);
  response.body.includes("Grain error");
});

test.get("/handler/redirect", response => {
  response.status.equals(Status.FOUND);
  response.headers.includes({ Location: "/redirected" });
});

test.get("/handler/redirect-status", response => {
  response.status.equals(Status.MOVED_PERMANENTLY);
  response.headers.includes({ Location: "/redirected" });
});

test.get("/handler/view", response => {
  response.body.includes(`<h1>View</h1>Hello, world.`);
});

test.get("/handler/view-options", response => {
  response.body.equals(`<h1>View</h1>Hello, world.
`);
});
