import config from "primate/config";
import de from "../locales/de-DE.ts";
import en from "../locales/en-US.ts";

export default config({
  i18n: {
    defaultLocale: "en-US",
    locales: {
      "en-US": en,
      "de-DE": de,
    },
  }
})
