import test from "primate/test";

test.get("/get", assert => {
  assert.body.equals({ name: "Donald", age: 30 });
});
