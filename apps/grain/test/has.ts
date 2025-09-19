import test from "primate/test";

test.get("/db/has", assert => {
  assert.body.equals({ has: true });
});
