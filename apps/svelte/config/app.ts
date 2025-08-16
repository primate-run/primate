import i18n from "@primate/i18n";
import svelte from "@primate/svelte";
import config from "primate/config";

export default config({
  http: {
    port: 10018,
  },
  modules: [svelte(), i18n()],
});
