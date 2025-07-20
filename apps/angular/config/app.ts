import config from "primate/config";
import angular from "@primate/angular";

export default config({
  http: {
    port: 10000,
  },
  modules: [angular()],
});
