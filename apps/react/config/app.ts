import i18n from "@primate/i18n";
import react from "@primate/react";
import config from "primate/config";

export default config({
  http: {
    port: 10012,
  },
  modules: [react({ extension: ".tsx" }), i18n()],
});
