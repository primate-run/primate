import test from "primate/test";

test.get("/try", assert => {
  assert.body.equals({ name: "Donald", age: 30 });
});
