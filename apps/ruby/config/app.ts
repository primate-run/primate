import ruby from "@primate/ruby";
import svelte from "@primate/svelte";
import config from "primate/config";

export default config({
  conditions: ["@primate/source"],
  http: {
    port: 10072, // 100RB
  },
  modules: [
    ruby(),
    svelte(),
  ],
});
