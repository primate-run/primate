import response from "primate/response";
import route from "primate/route";

 // render into `pages/counter.html`

export default route({
  get() {
    return response.view("Counter.jsx", { start: 10 },
      { page: "counter.html" });
  },
});
