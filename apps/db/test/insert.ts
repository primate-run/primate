import test from "primate/test";

test.get("/insert", assert => {
  assert.body.equals({ name: "Donald", age: 30 });
});
