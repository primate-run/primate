import view from "primate/view";
import route from "primate/route";

route.get(() => view("Counter.jsx", { start: 10 }));
