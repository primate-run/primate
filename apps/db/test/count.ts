import test from "primate/test";

test.get("/count", assert => {
  assert.body.equals({ count: 2 });
});
