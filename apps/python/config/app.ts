import config from "primate/config";
import python from "@primate/python";
import html from "@primate/html";

export default config({
  http: {
    port: 10008,
  },
  modules: [python(), html()],
});
