import Status from "primate/http/Status";
import test from "primate/test";

test.get("/dynamic/1", response => {
  response.body.equals("1");
});

test.get("/dynamic/foo", response => {
  response.body.equals("foo");
});

test.get("/dynamic/foo/bar", response => {
  response.status.equals(Status.NOT_FOUND);
});
