import config from "primate/config";
import html from "@primate/html";

export default config({
  modules: [html()],
  http: {
    port: 10013,
  },
});
