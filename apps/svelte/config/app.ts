import svelte from "@primate/svelte";
import env from "@rcompat/env";
import config from "primate/config";

const ssr = env.try("SSR") !== "0";
const csr = env.try("CSR") !== "0";

export default config({
  conditions: ["@primate/runtime", "@primate/source"],
  http: {
    port: 17858, // 1SVLT
  },
  modules: [
    svelte({ ssr, csr }),
  ],
});
