import Status from "primate/http/Status";
import test from "primate/test";

test.get("/dynamic/1", response => {
  response.body.equals("1");
});

test.get("/dynamic/1 1", response => {
  response.body.equals("1 1");
});

test.get("/dynamic/1%201", response => {
  response.body.equals("1 1");
});

test.get("/dynamic/foo", response => {
  response.body.equals("foo");
});

test.get("/dynamic//a%2Fb", response => {
  response.body.equals("a/b");
});

test.get("/dynamic/a/b", response => {
  response.status.equals(Status.NOT_FOUND);
});

test.get("/dynamic/foo/bar", response => {
  response.status.equals(Status.NOT_FOUND);
});

