import test from "primate/test";

test.get("/welcome", response => {
  response.body.equals("Hi John, would you like 5 apples?");
});
