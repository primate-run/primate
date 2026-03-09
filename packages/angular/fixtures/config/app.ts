import angular from "@primate/angular";
import config from "primate/config";

export default config({
  http: { port: 10023 },
  modules: [angular({ ssr: false })],
});
