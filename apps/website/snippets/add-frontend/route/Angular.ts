import Counter from "#view/Counter";
import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    return response.view(Counter, { start: 10 });
  },
});
