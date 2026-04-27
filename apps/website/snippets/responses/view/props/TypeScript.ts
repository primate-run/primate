import response from "primate/response";
import route from "primate/route";

export default route({
  get(request) {
    return response.view("Counter.jsx", { start: 10 });
  },
});
