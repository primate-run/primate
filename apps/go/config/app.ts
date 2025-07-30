import go from "@primate/go";
import html from "@primate/html";
import config from "primate/config";

export default config({
  http: {
    port: 10003,
  },
  modules: [go(), html()],
});
