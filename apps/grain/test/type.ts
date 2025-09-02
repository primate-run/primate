import test from "primate/test";

Object.entries({
  object: { name: "Donald" },
  array: [ { name: "Donald" }, { name: "Ryan" } ],
  string: "Hello, world!",
}).forEach(([path, body]) => {
  test.get(`/type/${path}`, response => {
    response.body.equals(body);
  });
});
