import python from "@primate/python";
import svelte from "@primate/svelte";
import config from "primate/config";

export default config({
  conditions: ["@primate/source"],
  http: {
    port: 10079, // 100PY
  },
  modules: [
    python(),
    svelte(),
  ],
});
