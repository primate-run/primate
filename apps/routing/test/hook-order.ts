import test from "primate/test";

test.get("/hook-order/outer/inner", response => { response.body.equals("outerinner"); });
