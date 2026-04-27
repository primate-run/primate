import html from "@primate/html";
import config from "primate/config";

export default config({
  conditions: ["@primate/source"],
  http: {
    port: 14865, // 1HTML
  },
  modules: [
    html(),
  ],
});
