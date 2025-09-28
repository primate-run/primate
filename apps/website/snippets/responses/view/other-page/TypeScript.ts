import response from "primate/response";
import route from "primate/route";

route.get(() => response.view("Counter.jsx", { start: 10 },
  { page: "counter.html" })); // render into `pages/counter.html`
