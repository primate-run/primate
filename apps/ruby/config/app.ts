import ruby from "@primate/ruby";
import svelte from "@primate/svelte";
import config from "primate/config";

export default config({
  http: {
    port: 10015,
  },
  modules: [ruby(), svelte()],
});
