import test from "primate/test";

test.get("/i18n/t", response => {
  response.body.equals("Hi John, would you like 5 apples?");
});

test.get("/i18n/locale", response => response.body.equals("en-US"));
