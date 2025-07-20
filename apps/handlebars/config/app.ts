import handlebars from "@primate/handlebars";
import config from "primate/config";

export default config({
  http: {
    port: 10004,
  },
  modules: [handlebars()],
});
