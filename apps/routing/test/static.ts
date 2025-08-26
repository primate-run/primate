import test from "primate/test";

test.get("/static", response => { response.body.equals("static"); });
test.get("//static", response => { response.body.equals("static"); });
test.get("/static/", response => { response.body.equals("static"); });
test.get("//static/", response => { response.body.equals("static"); });
test.get("/static//", response => { response.body.equals("static"); });
test.get("//static//", response => { response.body.equals("static"); });
test.get("/static/index", response => { response.body.equals("static"); });
test.get("/static/index/", response => { response.body.equals("static"); });
test.get("/static//index", response => { response.body.equals("static"); });
test.get("//static//index//", response => { response.body.equals("static"); });
test.get("//static//index//foo", response => { response.status.equals(404); });
