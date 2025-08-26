import test from "primate/test";

test.get("/rest/1", response => {
  response.body.equals("1");
});

test.get("/rest/foo", response => {
  response.body.equals("foo");
});

test.get("/rest/foo/bar", response => {
  response.body.equals("foo/bar");
});

test.get("/rest/foo%2Fbar", response => {
  response.body.equals("foo/bar");
});
