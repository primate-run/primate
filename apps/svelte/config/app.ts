import config from "primate/config";
import svelte from "@primate/svelte";
import i18n from "@primate/i18n";

export default config({
  modules: [svelte(), i18n()],
  http: {
    port: 10012,
  },
});
