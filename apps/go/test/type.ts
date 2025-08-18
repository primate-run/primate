import test from "primate/test";

Object.entries({
  array: [{ name: "Donald" }, { name: "Ryan" }],
  object: { name: "Donald" },
  string: "Hello, world!",
}).forEach(([path, body]) => {
  test.get(`/type/${path}`, response => {
    response.body.equals(body);
  });
});
