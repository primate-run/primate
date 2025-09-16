import test from "primate/test";

test.get("/db/", assert => {
  assert.body.equals({ count: 0 });
});
