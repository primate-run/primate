import test from "primate/test";

test.get("/", assert => {
  assert.body.equals({ count: 0 });
});
