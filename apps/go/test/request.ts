import test from "primate/test";

test.get("/request/query?foo=bar", response => {
  response.body.equals("bar");
});

test.get("/request/query?bar=foo", response => {
  response.body.equals("foo missing");
});

test.get("/request/validate-query?foo=bar&baz=1", response => {
  response.body.equals({ foo: "bar", baz: 1 });
});

test.get("/request/validate-query?foo=1&baz=foo", response => {
  response.body.equals("parsing failed for field 'baz': strconv.Atoi: parsing \"foo\": invalid syntax");
});
