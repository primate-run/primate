import view from "primate/response/view";
import route from "primate/route";

// will render Counter into `pages/counter.html` instead of `pages/app.html`
route.get(() => view("Counter.jsx", { start: 10 }, { page: "counter.html" }));
