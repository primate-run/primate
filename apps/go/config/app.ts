import go from "@primate/go";
import svelte from "@primate/svelte";
import config from "primate/config";

export default config({
  http: {
    port: 10003,
  },
  modules: [go(), svelte()],
});
