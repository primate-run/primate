import test from "primate/test";

test.get("/guard", response => { response.body.equals("wrong"); });

test.get("/guard?password=opensesame", response => {
  response.body.equals("right");
});
