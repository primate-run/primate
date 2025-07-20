import config from "primate/config";
import svelte from "@primate/svelte";
import i18n from "@primate/i18n";

export default config({
  http: {
    port: 10014,
  },
  modules: [svelte(), i18n()],
});
