import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    return response.view("Head.component.ts");
  },
});
