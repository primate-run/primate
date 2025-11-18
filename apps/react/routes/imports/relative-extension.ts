import Hello from "../../views/Hello.tsx";
import response from "primate/response";
import route from "primate/route";

route.get(() => response.view(Hello, { world: "world" }));
