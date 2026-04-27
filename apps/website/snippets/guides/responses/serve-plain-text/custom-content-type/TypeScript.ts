import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    return response("Custom text", {
      headers: { "Content-Type": "text/custom" },
    });
  },
});
