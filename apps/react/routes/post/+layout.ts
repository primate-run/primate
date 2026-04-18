import Layout from "#view/Layout";
import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    return response.view(Layout, {});
  },
});
