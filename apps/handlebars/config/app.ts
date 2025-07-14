import handlebars from "@primate/handlebars";
import config from "primate/config";

export default config({
  modules: [
    handlebars(),
  ],
  http: {
    port: 10003,
  },
});
