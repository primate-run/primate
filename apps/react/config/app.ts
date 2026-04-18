import react from "@primate/react";
import env from "@rcompat/env";
import config from "primate/config";

const ssr = env.try("SSR") !== "0";
const csr = env.try("CSR") !== "0";

export default config({
  conditions: ["@primate/runtime", "@primate/source"],
  http: {
    port: 10728, // 10RCT
  },
  modules: [
    react({ ssr, csr }),
  ],
});
