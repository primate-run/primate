import config from "primate/config";
import htmx from "@primate/htmx";

export default config({
  http: {
    port: 10005,
  },
  modules: [htmx()],
});
