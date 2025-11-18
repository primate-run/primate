import test from "primate/test";

const expected = "<h1>Hello, <!-- -->world</h1>";

[
  "pound-bare",
  "pound-extension",
  "relative-bare",
  "relative-extension",
  "string",
].forEach(route => {
  test.get(`/imports/${route}`, response => response.body.includes(expected));
});
