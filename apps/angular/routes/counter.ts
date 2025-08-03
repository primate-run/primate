import route from "primate/route";
import view from "primate/view";

route.get(() => view("Counter.component.ts", { start: 10 }));
