import test from "primate/test";

test.get("/update", assert => {
  assert.body.equals({ name: "Donald", age: 35 });
});
