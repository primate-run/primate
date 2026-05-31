import solid from "@primate/solid";
import env from "@rcompat/env";
import config from "primate/config";
import de from "../locales/de-DE.ts";
import en from "../locales/en-US.ts";

const ssr = env.try("SSR") !== "0";
const csr = env.try("CSR") !== "0";

export default config({
  conditions: ["@primate/runtime", "@primate/source"],
  http: {
    port: 10753, // 10SLD
  },
  modules: [
    solid({ ssr, csr }),
  ],
  i18n: {
    defaultLocale: "en-US",
    locales: {
      "en-US": en,
      "de-DE": de,
    },
  },
});
