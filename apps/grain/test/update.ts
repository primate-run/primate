import test from "primate/test";

test.get("/db/update", assert => {
  assert.body.equals({ name: "Donald", age: 35 });
});
