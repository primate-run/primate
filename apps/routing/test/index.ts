import test from "primate/test";

test.get("/", response => { response.body.equals("index"); });
test.get("//", response => { response.body.equals("index"); });
