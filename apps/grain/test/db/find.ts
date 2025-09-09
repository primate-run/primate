import test from "primate/test";

test.get("/find", assert => {
  assert.body.equals([{ name: "Donald", age: 30 }]);
});
