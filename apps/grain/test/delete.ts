import test from "primate/test";

test.get("/db/delete", assert => {
  assert.body.equals("deleted");
});
