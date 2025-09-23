import test from "primate/test";

test.get("/session", response => {
  response.body.equals({ foo: "bar"});
});
