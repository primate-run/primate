import test from "primate/test";

test.get("/session", response => {
  response.headers.get("set-cookie").includes("-");
  response.body.equals({ foo: "bar" });
});
