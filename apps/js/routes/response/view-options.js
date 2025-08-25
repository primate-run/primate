import view from "primate/response/view";
import route from "primate/route";

route.get(() => view("index.html", { hello: "world" }, { partial: true }));
