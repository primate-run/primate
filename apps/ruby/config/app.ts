import html from "@primate/html";
import ruby from "@primate/ruby";
import config from "primate/config";

export default config({
  http: {
    port: 10014,
  },
  modules: [ruby(), html()],
});
