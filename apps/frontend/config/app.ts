import angular from "@primate/angular";
import marko from "@primate/marko";
import react from "@primate/react";
import solid from "@primate/solid";
import svelte from "@primate/svelte";
import vue from "@primate/vue";
import env from "@rcompat/env";
import config from "primate/config";
import frontends from "../lib/frontends.ts";

const ssr = env.try("SSR") !== "0";
const csr = env.try("CSR") !== "0";

export default config({
  conditions: ["@primate/runtime", "@primate/source"],
  modules: [
    react({ ssr, csr, extensions: [frontends[0].extension] }),
    svelte({ ssr, csr }),
    vue({ ssr, csr }),
    solid({ ssr, csr, extensions: [frontends[3].extension] }),
    marko({ ssr, csr }),
    angular({ ssr, csr }),
  ],
});
