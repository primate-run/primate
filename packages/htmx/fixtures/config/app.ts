import htmx from "@primate/htmx";
import config from "primate/config";

export default config({
  http: { port: 10026 },
  modules: [htmx()],
});
