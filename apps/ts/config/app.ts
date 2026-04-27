import svelte from "@primate/svelte";
import config from "primate/config";

export default config({
  conditions: ["@primate/source"],
  http: {
    port: 10087, // 100TS,
  },
  modules: [
    svelte(),
  ],
});
