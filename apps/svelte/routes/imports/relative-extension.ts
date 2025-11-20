import response from "primate/response";
import route from "primate/route";
import Hello from "../../views/Hello.svelte";

route.get(() => response.view(Hello, { world: "world" }));
