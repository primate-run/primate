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

test.get("/type/null", response => {
  response.status.equals(204);
});
