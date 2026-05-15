import Redirected from "#view/Redirected";
import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    return response.view(Redirected);
  },
});
