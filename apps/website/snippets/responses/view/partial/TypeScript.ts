import view from "primate/response/view";
import route from "primate/route";

// will render Counter without embedding it into pages/app.html
route.get(() => view("Counter.jsx", { start: 10 }, { partial: true }));
