import test from "primate/test";

test.get("/hook", response => { response.body.equals("wrong"); });

test.get("/hook?password=opensesame", response => {
  response.body.equals("right");
});
