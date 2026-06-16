import svelte from "@primate/svelte";
import config from "primate/config";
import de from "../locales/de-DE.js";
import en from "../locales/en-US.js";

export default config({
  conditions: ["@primate/source"],
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
