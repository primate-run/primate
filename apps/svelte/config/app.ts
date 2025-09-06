import svelte from "@primate/svelte";
import config from "primate/config";

export default config({
  http: {
    port: 10018,
  },
  modules: [svelte()],
});
