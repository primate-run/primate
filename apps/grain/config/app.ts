import config from "primate/config";
import grain from "@primate/grain";
import html from "@primate/html";

export default config({
  modules: [
    grain(),
    html(),
  ],
  http: {
    port: 10002,
  },
});
