import htmx from "@primate/htmx";
import config from "primate/config";

export default config({
  conditions: ["@primate/source"],
  modules: [
    htmx({
      clientSideTemplates: {
        engine: "mustache",
      },
    }),
  ],
});
