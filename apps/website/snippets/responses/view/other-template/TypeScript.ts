import response from "primate/response";
import route from "primate/route";

 // render into `templates/counter.html`

export default route({
  get() {
    return response.view("Counter.jsx", { start: 10 },
      { template: "counter.html" });
  },
});
