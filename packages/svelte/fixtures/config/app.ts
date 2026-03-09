import svelte from "@primate/svelte";
import config from "primate/config";

export default config({
  http: { port: 10024 },
  modules: [svelte({ ssr: false })],
});
