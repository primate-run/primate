import route from "primate/route";
import response from "primate/response";

export default route({
  get() {
    return response("Hello", { headers: { "X-Custom": "value" } });
  },
});
