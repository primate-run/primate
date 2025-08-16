import test from "primate/test";

test.get("/exists", assert => {
  assert.body.equals({ exists: true });
});
