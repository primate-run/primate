import i18n from "@primate/i18n";
import solid from "@primate/solid";
import config from "primate/config";

export default config({
  modules: [solid({ extension: ".jsx" }), i18n()],
  http: {
    port: 10011,
  },
});
