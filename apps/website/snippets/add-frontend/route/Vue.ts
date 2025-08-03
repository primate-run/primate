import route from "primate/route";
import view from "primate/view";

route.get(() => view("Counter.vue", { start: 10 }));
