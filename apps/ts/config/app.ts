import config from "primate/config";
import html from "@primate/html";

export default config({
  http: {
    port: 10015,
  },
  modules: [html()],
});
