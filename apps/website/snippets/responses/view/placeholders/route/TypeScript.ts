import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    return response.view("Counter.jsx", { start: 10 }, {
      placeholders: {
        title: "Counter",
      },
    });
  },
});
