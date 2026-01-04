import test from "primate/test";

test.get("/nested", response => {
  response.body.equals("baz: 4");
});
