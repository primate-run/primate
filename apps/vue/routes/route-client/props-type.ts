import response from "primate/response";
import route from "primate/route";

export default route({
  get: () => response.page({ message: "vue" }),
});
