import response from "primate/response";
import Index from "#view/Index";
import route from "primate/route";

export default route({
  get() {
    return response.view(Index);
  },
});
