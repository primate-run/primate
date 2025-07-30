import route from "primate/route";
import view from "primate/view";

route.get(() => view("index.html", { hello: "world" }));
