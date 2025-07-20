import config from "primate/config";
import grain from "@primate/grain";
import html from "@primate/html";

export default config({
  http: {
    port: 10003,
  },
  modules: [grain(), html()],
});
