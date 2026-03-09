import vue from "@primate/vue";
import config from "primate/config";

export default config({
  http: { port: 10022 },
  modules: [vue({ ssr: false })],
});
