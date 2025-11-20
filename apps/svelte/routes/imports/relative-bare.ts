import Hello from "../../views/Hello";
import response from "primate/response";
import route from "primate/route";

route.get(() => response.view(Hello, { world: "world" }));
