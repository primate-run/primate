import response from "primate/response";
import route from "primate/route";

route.get(() => response.view("Hello.svelte", { world: "world" }));
