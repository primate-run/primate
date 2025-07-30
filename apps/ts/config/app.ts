import html from "@primate/html";
import config from "primate/config";

export default config({
  http: {
    port: 10018,
  },
  modules: [html()],
});
