import Hello from "#view/Hello";
import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    return response.view(Hello, { world: "world" });
  },
});
