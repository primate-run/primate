import config from "primate/config";
import htmx from "@primate/htmx";

export default config({
  modules: [htmx()],
  http: {
    port: 10004,
  },
});
