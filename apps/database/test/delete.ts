import test from "primate/test";

test.get("/delete", assert => {
  assert.body.equals("deleted");
});
