import response from "primate/response";
import route from "primate/route";

// will render Counter without embedding it into pages/app.html
route.get(() => response.view("Counter.jsx", { start: 10 }, { partial: true }));
