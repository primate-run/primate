import handlebars from "@primate/handlebars";
import config from "primate/config";

export default config({
  http: {
    port: 10005,
  },
  modules: [handlebars()],
});
