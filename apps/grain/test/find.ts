import test from "primate/test";

test.get("/db/find", assert => {
  assert.body.equals([{ name: "Donald", age: 30 }]);
});
