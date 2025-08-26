import Status from "primate/response/Status";
import test from "primate/test";

test.get("/optional", response => {
  response.body.equals("index");
});

test.get("/optional/", response => {
  response.body.equals("index");
});

test.get("/optional/1", response => {
  response.body.equals("1");
});

test.get("/optional/foo", response => {
  response.body.equals("foo");
});

test.get("/optional/foo%2Fbar", response => {
  response.body.equals("foo/bar");
});

test.get("/optional/foo/bar", response => {
  response.status.equals(Status.NOT_FOUND);
});

