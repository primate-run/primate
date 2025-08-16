import test from "primate/test";

test.get("/optional-rest", response => {
  response.body.equals("index");
});

test.get("/optional-rest/1", response => {
  response.body.equals("1");
});

test.get("/optional-rest/foo", response => {
  response.body.equals("foo");
});

test.get("/optional-rest/foo/bar", response => {
  response.body.equals("foo/bar");
});
