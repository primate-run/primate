import view from "primate/response/view";
import route from "primate/route";

route.get(() => view("Counter.component.ts", { start: 10 }));
