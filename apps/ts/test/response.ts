import Status from "primate/http/Status";
import test from "primate/test";

test.get("/response/error", response => {
  response.status.equals(Status.NOT_FOUND);
});

test.get("/response/error-options", response => {
  response.status.equals(Status.NOT_FOUND);
  response.body.includes("JavaScript error");
});

test.get("/response/redirect", response => {
  response.status.equals(Status.FOUND);
  response.headers.includes({ location: "/redirected" });
});

test.get("/response/redirect-status", response => {
  response.status.equals(Status.MOVED_PERMANENTLY);
  response.headers.includes({ location: "/redirected" });
});

test.get("/response/view", response => {
  response.body.includes("<h1>View</h1>Hello, bar.");
});

test.get("/response/view-options", response => {
  response.body.equals(`<h1>View</h1>Hello, bar.
`);
});
