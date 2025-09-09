import test from "primate/test";

test.get("/has", assert => {
  assert.body.equals({ has: true });
});
