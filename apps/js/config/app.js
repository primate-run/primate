import svelte from "@primate/svelte";
import config from "primate/config";
import de from "../locales/de-DE.js";
import en from "../locales/en-US.js";

export default config({
  conditions: ["@primate/source"],
  http: {
    port: 10057, // 100JS,
  },
  modules: [
    svelte(),
  ],
  i18n: {
    defaultLocale: "en-US",
    locales: {
      "en-US": en,
      "de-DE": de,
    },
  },
});
