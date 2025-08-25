import config from "primate/config";
import html from "@primate/html";

export default config({
  http: {
    port: 10001,
  },
  modules: [
    html(),
  ],
});
