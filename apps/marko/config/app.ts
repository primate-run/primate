import marko from "@primate/marko";
import env from "@rcompat/env";
import config from "primate/config";

const ssr = env.try("SSR") !== "0";
const csr = env.try("CSR") !== "0";

export default config({
  http: {
    port: 10675, // 10MRK
  },
  modules: [
    marko({ ssr, csr }),
  ],
});
