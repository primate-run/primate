import route from "primate/route";
import view from "primate/view";

route.get(() => view("Counter.svelte", { start: 10 }));
