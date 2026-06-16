import python from "@primate/python";
import svelte from "@primate/svelte";
import config from "primate/config";
import de from "../locales/de-DE.ts";
import en from "../locales/en-US.ts";

export default config({
  conditions: ["@primate/source"],
  modules: [
    python(),
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
