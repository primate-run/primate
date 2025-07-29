import test from "primate/test";

test.get("/redirected", response => {
  response.body.equals("Redirected!");
});
