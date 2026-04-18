import go from "@primate/go";
import svelte from "@primate/svelte";
import config from "primate/config";

export default config({
  conditions: ["@primate/source"],
  http: {
    port: 10046, // 100GO
  },
  modules: [
    go(),
    svelte(),
  ],
});
