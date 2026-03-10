import response from "primate/response";
import route from "primate/route";

route.get(() => response.view("props.html", { foo: "bar" }));
