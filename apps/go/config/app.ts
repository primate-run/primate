import config from "primate/config";
import go from "@primate/go";
import html from "@primate/html";

export default config({
  http: {
    port: 10002,
  },
  modules: [go(), html()],
});
