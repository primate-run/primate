import response from "primate/response";
import route from "primate/route";

route.get(() => response.view("Counter.jsx", { start: 10 }, {
  placeholders: {
    title: "Counter",
  },
}));
