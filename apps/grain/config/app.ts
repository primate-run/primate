import grain from "@primate/grain";
import html from "@primate/html";
import config from "primate/config";

export default config({
  http: {
    port: 10004,
  },
  modules: [grain(), html()],
});
