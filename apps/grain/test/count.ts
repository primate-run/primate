import test from "primate/test";

test.get("/db/count", assert => {
  assert.body.equals({ count: 2 });
});
