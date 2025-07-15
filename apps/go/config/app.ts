import config from "primate/config";
import go from "@primate/go";
import html from "@primate/html";

export default config({
  modules: [go(), html()],
  http: {
    port: 10001,
  },
});
