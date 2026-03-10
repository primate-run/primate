import marko from "@primate/marko";
import config from "primate/config";

export default config({
  http: { port: 10028 },
  modules: [marko()],
});
