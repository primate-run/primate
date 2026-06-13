import svelte from "@primate/svelte";
import env from "@rcompat/env";
import p from "pema";
import config from "primate/config";
import de from "../locales/de-DE.ts";
import en from "../locales/en-US.ts";

const ssr = env.try("SSR") !== "0";
const csr = env.try("CSR") !== "0";

export default config({
  conditions: ["@primate/runtime", "@primate/source"],
  http: {
    port: +env.get("PORT"), // 1SVLT
  },
  /*env: {
    schema: p({
      PORT: p.u16,
    }),
  },*/
  modules: [
    svelte({ ssr, csr }),
  ],
  i18n: {
    defaultLocale: "en-US",
    locales: {
      "en-US": en,
      "de-DE": de,
    },
  },
});
