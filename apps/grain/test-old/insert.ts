import test from "primate/test";

test.get("/db/insert", assert => {
  assert.body.equals({ name: "Donald", age: 30 });
});
