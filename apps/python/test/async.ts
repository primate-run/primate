import test from "primate/test";

test.get("/async", response => {
  response.body.equals("Hi from async");
});
