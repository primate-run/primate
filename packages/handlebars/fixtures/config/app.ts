import handlebars from "@primate/handlebars";
import config from "primate/config";

export default config({
  http: { port: 10027 },
  modules: [handlebars()],
});
