import Hello from "#view/Hello.svelte";
import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    return response.view(Hello, { world: "world" });
  },
});
