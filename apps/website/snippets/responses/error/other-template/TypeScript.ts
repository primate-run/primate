import response from "primate/response";
import route from "primate/route";

// use templates/custom-error.html instead of templates/error.html

export default route({
  get() {
    return response.error({ template: "custom-error.html" });
  },
});
