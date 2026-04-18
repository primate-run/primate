import Hello from "#view/Hello.tsx";
import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    return response.view(Hello, { world: "world" });
  },
});
