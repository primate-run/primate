import response from "primate/response";
import route from "primate/route";

route.get(() => response.view("props.marko", { foo: "bar" }));
