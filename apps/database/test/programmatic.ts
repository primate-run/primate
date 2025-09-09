import test from "primate/test";

test.get("/programmatic", assert => {
  assert.body.equals("User");
});
