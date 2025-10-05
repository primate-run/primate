import response from "primate/response";
import route from "primate/route";

route.get(request => response.view("Counter.jsx", { start: 10 }));
