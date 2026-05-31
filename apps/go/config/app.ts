import go from "@primate/go";
import svelte from "@primate/svelte";
import config from "primate/config";
import de from "../locales/de-DE.ts";
import en from "../locales/en-US.ts";

export default config({
  conditions: ["@primate/source"],
  http: {
    port: 10046, // 100GO
  },
  modules: [
    go(),
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
