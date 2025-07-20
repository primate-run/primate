import config from "primate/config";
import ruby from "@primate/ruby";
import html from "@primate/html";

export default config({
  http: {
    port: 10011,
  },
  modules: [ruby(), html()],
});
