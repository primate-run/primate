import response from "primate/response";
import route from "primate/route";

// use pages/custom-error.html instead of pages/error.html

export default route({
  get() {
    return response.error({ page: "custom-error.html" });
  },
});
