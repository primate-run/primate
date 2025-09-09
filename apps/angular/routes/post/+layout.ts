import view from "primate/response/view";
import route from "primate/route";

route.get(() => view("Layout.component.ts", { user: { name: "John" } }));
