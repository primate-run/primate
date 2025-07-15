import config from "primate/config";
import python from "@primate/python";
import html from "@primate/html";

export default config({
  modules: [python(), html()],
  http: {
    port: 10007,
  },
});
