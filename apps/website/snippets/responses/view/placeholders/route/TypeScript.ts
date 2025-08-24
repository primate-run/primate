import view from "primate/response/view";
import route from "primate/route";

route.get(() => view("Counter.jsx", { start: 10 }, {
  placeholders: {
    title: "Counter",
  },
}));
