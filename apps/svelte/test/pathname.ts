import test from "primate/test";

const expected = "PATHNAME: /pathname";

test.get("/pathname", response => {
  response.body.includes(expected);
});
