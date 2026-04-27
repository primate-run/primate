import htmx from "@primate/htmx";
import config from "primate/config";

export default config({
  conditions: ["@primate/source"],
  http: {
    port: 14869, // 1HTMX
  },
  modules: [
    htmx({
      clientSideTemplates: {
        engine: "mustache",
      },
    }),
  ],
});
