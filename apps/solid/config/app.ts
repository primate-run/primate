import i18n from "@primate/i18n";
import solid from "@primate/solid";
import config from "primate/config";

export default config({
  http: {
    port: 10017,
  },
  modules: [solid({ extension: ".tsx" }), i18n()],
});
