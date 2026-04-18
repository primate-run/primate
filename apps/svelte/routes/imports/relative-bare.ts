import response from "primate/response";
import route from "primate/route";
import Hello from "../../views/Hello";

export default route({
  get() {
    return response.view(Hello, { world: "world" });
  },
});
