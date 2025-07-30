import html from "@primate/html";
import python from "@primate/python";
import config from "primate/config";

export default config({
  http: {
    port: 10011,
  },
  modules: [python(), html()],
});
